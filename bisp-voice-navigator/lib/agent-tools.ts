import {
  evaluateKafaalat,
  evaluateTaleemiWazaif,
  evaluateNashonuma,
  evaluateScholarship,
  evaluateBachat,
  evaluateFallback,
  EligibilityResult
} from './bisp-rules-engine';

import { Type, FunctionDeclaration } from '@google/genai';

export const checkEligibilityDeclaration: FunctionDeclaration = {
  name: "check_eligibility",
  description: "Evaluate a user's eligibility for BISP programs. MUST be called when user wants to know if they qualify. If required parameters are missing, do not guess them; ask the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      program: {
        type: Type.STRING,
        description: "The BISP program the user wants to apply for (kafaalat, taleemi_wazaif, nashonuma, scholarship, bachat, or fallback).",
        enum: ["kafaalat", "taleemi_wazaif", "nashonuma", "scholarship", "bachat", "fallback"]
      },
      monthly_income: {
        type: Type.NUMBER,
        description: "The user's approximate monthly household income in PKR."
      },
      gender: {
        type: Type.STRING,
        description: "The gender of the applicant ('male' or 'female').",
        enum: ["male", "female", "other", "unknown"]
      },
      province: {
        type: Type.STRING,
        description: "The user's province (e.g. Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan)."
      },
      has_disability: {
        type: Type.BOOLEAN,
        description: "Whether anyone in the family has a disability."
      },
      family_size: {
        type: Type.NUMBER,
        description: "Total number of people living in the household."
      },
      has_assets: {
        type: Type.BOOLEAN,
        description: "Whether the household owns significant assets (like a car, large land, etc)."
      },
      // Taleemi Wazaif specific
      child_age: {
        type: Type.NUMBER,
        description: "Age of the child applying for educational stipends."
      },
      child_gender: {
        type: Type.STRING,
        description: "Gender of the child ('boy' or 'girl').",
        enum: ["boy", "girl"]
      },
      is_mother_kafaalat: {
        type: Type.BOOLEAN,
        description: "Is the mother already receiving Kafaalat?"
      },
      // Nashonuma specific
      is_pregnant_lactating: {
        type: Type.BOOLEAN,
        description: "Is the applicant pregnant or lactating?"
      },
      child_age_months: {
        type: Type.NUMBER,
        description: "Age of the child in months (for Nashonuma)."
      },
      // Scholarship & Bachat specific
      has_public_university_admission: {
        type: Type.BOOLEAN,
        description: "Does the user have admission to an HEC-recognized public sector university on open merit?"
      },
      is_kafaalat_beneficiary: {
        type: Type.BOOLEAN,
        description: "Is the user currently a Kafaalat beneficiary?"
      }
    },
    required: ["program"]
  }
};

export async function executeEligibilityCheck(args: any): Promise<EligibilityResult> {
  const { program } = args;

  // Enforce required data collection based on program
  if (program === 'kafaalat') {
    if (args.monthly_income === undefined || args.gender === undefined) {
      return { eligible: false, message: "Error: You must ask the user for their gender (male or female), monthly household income, family size, whether they own assets, and if they have any disabilities before checking Kafaalat eligibility." };
    }
    return evaluateKafaalat(args.monthly_income, args.has_disability || false, args.gender, args.family_size, args.has_assets, args.province);
  }

  if (program === 'taleemi_wazaif') {
    if (args.child_age === undefined || args.child_gender === undefined || args.is_mother_kafaalat === undefined) {
      return { eligible: false, message: "Error: You must ask for the child's age, gender, and whether the mother is currently receiving Kafaalat." };
    }
    return evaluateTaleemiWazaif(args.child_age, args.child_gender, args.is_mother_kafaalat);
  }

  if (program === 'nashonuma') {
    if (args.is_pregnant_lactating === undefined && args.child_age_months === undefined) {
      return { eligible: false, message: "Error: You must ask if the applicant is pregnant/lactating or if they are applying for a child under 2 years old (need child's age in months and gender)." };
    }
    return evaluateNashonuma(args.is_pregnant_lactating || false, args.child_age_months || null, args.child_gender || null);
  }

  if (program === 'scholarship') {
    if (args.has_public_university_admission === undefined || args.monthly_income === undefined) {
      return { eligible: false, message: "Error: You must ask if the applicant has secured admission to a public university on open merit, and what their monthly household income, family size, and asset ownership is." };
    }
    return evaluateScholarship(args.has_public_university_admission, args.monthly_income, args.family_size, args.has_assets, args.province);
  }

  if (program === 'bachat') {
    if (args.is_kafaalat_beneficiary === undefined || args.monthly_income === undefined) {
      return { eligible: false, message: "Error: You must ask if the applicant is an active Kafaalat beneficiary and what their monthly household income is." };
    }
    return evaluateBachat(args.is_kafaalat_beneficiary, args.monthly_income);
  }

  if (program === 'fallback') {
    if (!args.province) {
      return { eligible: false, message: "Error: You must ask for the user's province to determine fallback programs like Sehat Sahulat." };
    }
    return evaluateFallback(args.province);
  }

  return { eligible: false, message: "Unknown program specified." };
}
