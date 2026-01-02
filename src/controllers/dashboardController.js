import { prisma } from "../config/prismaClient.js";

/**
 * Get Admin Dashboard Statistics
 * Returns comprehensive analytics for administrators
 */
const getAdminDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify admin role
    const user = await prisma.users.findUnique({
      where: { id: BigInt(userId) },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isAdmin = user?.user_roles?.some((ur) => ur.role.name === 'Admin');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // 1. Total Users Count
    const totalUsers = await prisma.users.count();

    // 2. Total Tests Created
    const totalTests = await prisma.writing_tests.count();

    // 3. Total Submissions
    const totalSubmissions = await prisma.writing_submissions.count();

    // 4. Total Expert Review Requests
    const totalExpertReviewRequests = await prisma.expert_review_requests.count();

    // 5. Expert Review Requests by Status
    const reviewRequestsByStatus = await prisma.expert_review_requests.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // 6. Recent Submissions (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubmissions = await prisma.writing_submissions.count({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 7. Average Scores (AI and Expert)
    const submissionsWithScores = await prisma.writing_submissions.findMany({
      where: {
        status: 'evaluated',
      },
      select: {
        overall_band_score: true,
        expert_overall_score: true,
      },
    });

    const avgAiScore =
      submissionsWithScores.length > 0
        ? submissionsWithScores.reduce((sum, s) => sum + (s.overall_band_score || 0), 0) /
          submissionsWithScores.length
        : 0;

    const expertScores = submissionsWithScores.filter((s) => s.expert_overall_score !== null);
    const avgExpertScore =
      expertScores.length > 0
        ? expertScores.reduce((sum, s) => sum + (s.expert_overall_score || 0), 0) / expertScores.length
        : 0;

    // 8. Submissions Over Time (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const submissionsLast7Days = await prisma.writing_submissions.findMany({
      where: {
        created_at: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        created_at: true,
      },
    });

    // Group by day
    const submissionsByDay = submissionsLast7Days.reduce((acc, submission) => {
      const date = submission.created_at.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // 9. Actual AI API Costs (from database)
    const costData = await prisma.writing_submissions.aggregate({
      _sum: {
        api_cost: true,
        tokens_used: true,
      },
      _count: {
        api_cost: true,
      },
    });

    const totalAICost = costData._sum.api_cost ? parseFloat(costData._sum.api_cost) : 0;
    const totalTokens = costData._sum.tokens_used || 0;
    const submissionsWithCost = costData._count.api_cost || 0;
    const avgCostPerSubmission = submissionsWithCost > 0 ? totalAICost / submissionsWithCost : 0;

    // 10. Active Users (users who submitted in last 30 days)
    const activeUsers = await prisma.writing_submissions.findMany({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
      distinct: ['user_id'],
      select: {
        user_id: true,
      },
    });

    // 11. Recent Users (Last 10)
    const recentUsers = await prisma.users.findMany({
      take: 10,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    // 12. Top Performers (by average score)
    const topPerformers = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        AVG(ws.overall_band_score) as avg_score,
        COUNT(ws.id) as test_count
      FROM users u
      INNER JOIN writing_submissions ws ON u.id = ws.user_id
      WHERE ws.status = 'evaluated' AND ws.overall_band_score > 0
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(ws.id) >= 3
      ORDER BY avg_score DESC
      LIMIT 5
    `;

    const dashboardData = {
      overview: {
        totalUsers,
        totalTests,
        totalSubmissions,
        totalExpertReviewRequests,
        recentSubmissions,
        activeUsersCount: activeUsers.length,
      },
      expertReviews: {
        total: totalExpertReviewRequests,
        byStatus: reviewRequestsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
      },
      scores: {
        avgAiScore: parseFloat(avgAiScore.toFixed(1)),
        avgExpertScore: parseFloat(avgExpertScore.toFixed(1)),
      },
      aiCosts: {
        totalCost: parseFloat(totalAICost.toFixed(6)),
        avgCostPerSubmission: parseFloat(avgCostPerSubmission.toFixed(6)),
        totalTokensUsed: totalTokens,
        totalEvaluations: totalSubmissions,
        submissionsWithCostData: submissionsWithCost,
      },
      submissionsChart: {
        last7Days: submissionsByDay,
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        createdAt: u.created_at,
      })),
      topPerformers: topPerformers.map((p) => ({
        id: p.id.toString(),
        name: p.name,
        email: p.email,
        avgScore: parseFloat(Number(p.avg_score).toFixed(1)),
        testCount: Number(p.test_count),
      })),
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

/**
 * Get User Dashboard Statistics
 * Returns personal statistics for the authenticated user
 */
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1. Total Tests Taken
    const totalTestsTaken = await prisma.writing_submissions.count({
      where: {
        user_id: BigInt(userId),
        status: 'evaluated',
      },
    });

    // 2. Average Score
    const submissions = await prisma.writing_submissions.findMany({
      where: {
        user_id: BigInt(userId),
        status: 'evaluated',
        overall_band_score: {
          gt: 0,
        },
      },
      select: {
        overall_band_score: true,
        expert_overall_score: true,
        created_at: true,
      },
    });

    const avgScore =
      submissions.length > 0
        ? submissions.reduce((sum, s) => sum + s.overall_band_score, 0) / submissions.length
        : 0;

    // 3. Expert Review Requests Count
    const expertReviewRequests = await prisma.expert_review_requests.count({
      where: {
        user_id: BigInt(userId),
      },
    });

    // 4. Expert Reviews by Status
    const expertReviewsByStatus = await prisma.expert_review_requests.groupBy({
      by: ['status'],
      where: {
        user_id: BigInt(userId),
      },
      _count: {
        id: true,
      },
    });

    // 5. Recent Test Results (Last 5)
    const recentTests = await prisma.writing_submissions.findMany({
      where: {
        user_id: BigInt(userId),
        status: 'evaluated',
      },
      take: 5,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        tests: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    // 6. Progress Over Time (Last 10 submissions)
    const progressData = submissions
      .slice(0, 10)
      .reverse()
      .map((s, index) => ({
        testNumber: index + 1,
        score: s.overall_band_score,
        date: s.created_at,
      }));

    // 7. Task-wise Performance
    const taskPerformance = await prisma.writing_submissions.findMany({
      where: {
        user_id: BigInt(userId),
        status: 'evaluated',
      },
      select: {
        ai_evaluation: true,
      },
    });

    let task1Scores = [];
    let task2Scores = [];

    taskPerformance.forEach((sub) => {
      const aiEval = sub.ai_evaluation;
      if (aiEval?.task1?.overall_band) {
        task1Scores.push(aiEval.task1.overall_band);
      }
      if (aiEval?.task2?.overall_band) {
        task2Scores.push(aiEval.task2.overall_band);
      }
    });

    const avgTask1Score =
      task1Scores.length > 0 ? task1Scores.reduce((sum, s) => sum + s, 0) / task1Scores.length : 0;
    const avgTask2Score =
      task2Scores.length > 0 ? task2Scores.reduce((sum, s) => sum + s, 0) / task2Scores.length : 0;

    // 8. Highest Score
    const highestScore = submissions.length > 0 ? Math.max(...submissions.map((s) => s.overall_band_score)) : 0;

    // 9. Lowest Score
    const lowestScore = submissions.length > 0 ? Math.min(...submissions.map((s) => s.overall_band_score)) : 0;

    const dashboardData = {
      overview: {
        totalTestsTaken,
        avgScore: parseFloat(avgScore.toFixed(1)),
        highestScore: parseFloat(highestScore.toFixed(1)),
        lowestScore: parseFloat(lowestScore.toFixed(1)),
        expertReviewRequests,
      },
      expertReviews: {
        total: expertReviewRequests,
        byStatus: expertReviewsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
      },
      taskPerformance: {
        task1Avg: parseFloat(avgTask1Score.toFixed(1)),
        task2Avg: parseFloat(avgTask2Score.toFixed(1)),
        task1Count: task1Scores.length,
        task2Count: task2Scores.length,
      },
      recentTests: recentTests.map((test) => {
        const aiEval = test.ai_evaluation;
        return {
          id: test.id.toString(),
          testName: test.tests.name,
          category: test.tests.type,
          score: test.overall_band_score,
          expertScore: test.expert_overall_score,
          task1Score: aiEval?.task1?.overall_band || 0,
          task2Score: aiEval?.task2?.overall_band || 0,
          date: test.created_at,
        };
      }),
      progress: progressData,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

export { getAdminDashboard, getUserDashboard };
