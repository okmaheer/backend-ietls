import { prisma } from "../config/prismaClient.js";
import { success, error } from "../utils/response.js";
import bcrypt from "bcrypt";

// 📄 Index - Get all users with pagination
export const index = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sort_by || "id";
    const sortOrder = req.query.sort_order || "desc";

    // Calculate skip value for pagination
    const skip = (page - 1) * perPage;

    // Build where clause for search (removed mode: "insensitive")
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { country: { contains: search } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await prisma.users.count({
      where: whereClause,
    });

    // Get paginated users
    const users = await prisma.users.findMany({
      where: whereClause,
      include: { user_details: true },
      orderBy: { [sortBy]: sortOrder },
      skip: skip,
      take: perPage,
    });

    // Calculate pagination metadata
    const lastPage = Math.ceil(total / perPage);
    const from = total > 0 ? skip + 1 : 0;
    const to = Math.min(skip + perPage, total);

    // Return paginated response (Laravel-style)
    success(res, {
      data: users,
      current_page: page,
      per_page: perPage,
      total: total,
      last_page: lastPage,
      from: from,
      to: to,
      next_page: page < lastPage ? page + 1 : null,
      prev_page: page > 1 ? page - 1 : null,
    }, "Users fetched successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to fetch users");
  }
};

// 📝 Create - Show create form (for API, this might return metadata or validation rules)
export const create = async (req, res) => {
  try {
    const countries = getCountries();
    success(res, { countries }, "Create user form data");
  } catch (err) {
    console.error(err);
    error(res, "Failed to load create form");
  }
};

// ➕ Store - Create new user
export const store = async (req, res) => {
  try {
    const { name, email, password, phone, country, duration, status } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        country,
        duration,
        status: String(status), // Convert to string
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // TODO: Assign role "User" - implement role assignment based on your role system
    // await assignRole(user.id, "User");

    success(res, user, "User created successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to create user");
  }
};

// ✏️ Edit - Get user for editing
export const edit = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const user = await prisma.users.findUnique({
      where: { id },
      include: { user_details: true },
    });
    
    if (!user) return error(res, "User not found", 404);
    
    const countries = getCountries();
    success(res, { user, countries }, "User fetched for editing");
  } catch (err) {
    console.error(err);
    error(res, "Failed to fetch user");
  }
};

// 🔄 Update - Update existing user
export const update = async (req, res) => {
  try {
    const { user_id, name, email, password, phone, country, duration, status } = req.body;
    const id = BigInt(user_id);
    
    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      country,
      duration,
      status: String(status), // Convert to string
      updated_at: new Date(),
    };

    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    // TODO: Update role if needed
    // await assignRole(user_id, "User");

    success(res, user, "User updated successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to update user");
  }
};

// ❌ Delete - Delete user
export const deleteUser = async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    
    await prisma.users.delete({ 
      where: { id } 
    });
    
    success(res, null, "User deleted successfully");
  } catch (err) {
    console.error(err);
    error(res, "Failed to delete user");
  }
};

// Helper function - Get countries list
const getCountries = () => {
  return [
    "Afghanistan",
    "Albania",
    "Algeria",
    "American Samoa",
    "Andorra",
    "Angola",
    "Anguilla",
    "Antarctica",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Aruba",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bermuda",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Bouvet Island",
    "Brazil",
    "British Indian Ocean Territory",
    "Brunei Darussalam",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Cayman Islands",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Christmas Island",
    "Cocos (Keeling) Islands",
    "Colombia",
    "Comoros",
    "Congo",
    "Congo, the Democratic Republic of the",
    "Cook Islands",
    "Costa Rica",
    "Cote d'Ivoire",
    "Croatia (Hrvatska)",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "East Timor",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Ethiopia",
    "Falkland Islands (Malvinas)",
    "Faroe Islands",
    "Fiji",
    "Finland",
    "France",
    "France, Metropolitan",
    "French Guiana",
    "French Polynesia",
    "French Southern Territories",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Gibraltar",
    "Greece",
    "Greenland",
    "Grenada",
    "Guadeloupe",
    "Guam",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Heard and Mc Donald Islands",
    "Holy See (Vatican City State)",
    "Honduras",
    "Hong Kong",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran (Islamic Republic of)",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Korea, Democratic People's Republic of",
    "Korea, Republic of",
    "Kuwait",
    "Kyrgyzstan",
    "Lao People's Democratic Republic",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libyan Arab Jamahiriya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Macau",
    "Macedonia, The Former Yugoslav Republic of",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Martinique",
    "Mauritania",
    "Mauritius",
    "Mayotte",
    "Mexico",
    "Micronesia, Federated States of",
    "Moldova, Republic of",
    "Monaco",
    "Mongolia",
    "Montserrat",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "Netherlands Antilles",
    "New Caledonia",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "Niue",
    "Norfolk Island",
    "Northern Mariana Islands",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Pitcairn",
    "Poland",
    "Portugal",
    "Puerto Rico",
    "Qatar",
    "Reunion",
    "Romania",
    "Russian Federation",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint LUCIA",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Georgia and the South Sandwich Islands",
    "Spain",
    "Sri Lanka",
    "St. Helena",
    "St. Pierre and Miquelon",
    "Sudan",
    "Suriname",
    "Svalbard and Jan Mayen Islands",
    "Swaziland",
    "Sweden",
    "Switzerland",
    "Syrian Arab Republic",
    "Taiwan, Province of China",
    "Tajikistan",
    "Tanzania, United Republic of",
    "Thailand",
    "Togo",
    "Tokelau",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Turks and Caicos Islands",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "United States Minor Outlying Islands",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Venezuela",
    "Viet Nam",
    "Virgin Islands (British)",
    "Virgin Islands (U.S.)",
    "Wallis and Futuna Islands",
    "Western Sahara",
    "Yemen",
    "Serbia",
    "Zambia",
    "Zimbabwe"
  ];
};