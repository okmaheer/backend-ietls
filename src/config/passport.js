import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID', 
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_CALLBACK_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Validate profile data
        if (!profile.id || !profile.emails?.[0]?.value) {
          return done(new Error('Invalid profile data from Google'), null);
        }

        const user = {
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName || profile.emails[0].value.split('@')[0],
          picture: profile.photos?.[0]?.value || null,
        };
        
        return done(null, user);
      } catch (error) {
        console.error("❌ Passport Strategy Error:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;