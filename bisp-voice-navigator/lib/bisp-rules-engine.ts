import bispData from './bisp-data.json';

const BISP_PMT_CUTOFF = 32.0;

export interface EligibilityResult {
  eligible: boolean;
  message: string;
  pmt?: {
    score: number;
    cutoff: number;
    confidence: "High" | "Medium" | "Low";
    confidenceReason: string;
    factors: Array<{ name: string; value: string; weight: number }>;
  };
  fallbacks?: Array<{ name: string; reason: string }>;
}

export function calculateMockPMT(monthlyIncome: number, familySize?: number, hasAssets?: boolean, province?: string) {
  let score = 45; // Base score
  let confidence: "High" | "Medium" | "Low" = "High";
  let confidenceReason = "All key factors provided.";
  const factors: Array<{ name: string; value: string; weight: number }> = [];

  // Income factor
  if (monthlyIncome <= 15000) {
    score -= 15;
    factors.push({ name: "Monthly Income", value: `PKR ${monthlyIncome}`, weight: -15 });
  } else if (monthlyIncome <= 35000) {
    score -= 5;
    factors.push({ name: "Monthly Income", value: `PKR ${monthlyIncome}`, weight: -5 });
  } else {
    score += 10;
    factors.push({ name: "Monthly Income", value: `PKR ${monthlyIncome}`, weight: 10 });
  }

  // Family size factor
  if (familySize !== undefined) {
    if (familySize >= 6) {
      score -= 5;
      factors.push({ name: "Family Size", value: `${familySize} members`, weight: -5 });
    } else {
      factors.push({ name: "Family Size", value: `${familySize} members`, weight: 0 });
    }
  } else {
    confidence = "Medium";
    confidenceReason = "Missing family size and asset ownership data. Score is estimated.";
  }

  // Asset factor
  if (hasAssets !== undefined) {
    if (hasAssets) {
      score += 10;
      factors.push({ name: "Asset Ownership", value: "Yes", weight: 10 });
    } else {
      score -= 5;
      factors.push({ name: "Asset Ownership", value: "None", weight: -5 });
    }
  }

  // Province factor
  if (province) {
    if (['Balochistan', 'KPK', 'Khyber Pakhtunkhwa'].includes(province)) {
      score -= 2;
      factors.push({ name: "Province", value: province, weight: -2 });
    } else {
      factors.push({ name: "Province", value: province, weight: 0 });
    }
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score * 10) / 10)),
    cutoff: BISP_PMT_CUTOFF,
    confidence,
    confidenceReason,
    factors
  };
}

function getFallbacks(province?: string, monthlyIncome?: number) {
  const fallbacks = [];
  const incomeText = monthlyIncome ? `your reported income of PKR ${monthlyIncome}` : `your income`;
  if (province) {
    const isUniversal = bispData.pmt_rules.fallbacks.sehat_sahulat.universal_coverage_provinces.includes(province);
    if (isUniversal) {
      fallbacks.push({ name: "Sehat Sahulat", reason: `Because you live in ${province}, you are eligible for Universal Free Healthcare under the Sehat Sahulat program regardless of your PMT score.` });
    } else {
      fallbacks.push({ name: "Akhuwat Microfinance", reason: `Since ${incomeText} exceeds the BISP threshold, we highly recommend applying for an Akhuwat interest-free microfinance loan to support your household.` });
    }
  } else {
    fallbacks.push({ name: "Akhuwat Microfinance", reason: `Since ${incomeText} exceeds the BISP threshold, we highly recommend exploring an Akhuwat interest-free loan.` });
  }
  return fallbacks;
}

export function evaluateKafaalat(monthlyIncome: number, hasDisability: boolean, gender: 'male' | 'female' | 'other' | 'unknown' = 'unknown', familySize?: number, hasAssets?: boolean, province?: string): EligibilityResult {
  const pmt = calculateMockPMT(monthlyIncome, familySize, hasAssets, province);
  const eligible = pmt.score <= BISP_PMT_CUTOFF || hasDisability;
  const fallbacks = getFallbacks(province, monthlyIncome);

  if (gender === 'male') {
    return {
      eligible: false,
      message: "Benazir Kafaalat stipends are exclusively for the female head of the family. While your household might qualify, the female head must visit the Tehsil office.",
      pmt,
      fallbacks
    };
  }

  if (eligible) {
    const stipend = bispData.pmt_rules.kafaalat.quarterly_stipend_pkr;
    return {
      eligible: true,
      message: `You may qualify for the Benazir Kafaalat program. The current quarterly stipend is ${stipend} PKR. Guideline: Bring your original CNIC to your nearest BISP Tehsil Office. You must complete Biometric Verification and ensure your household is updated in the Dynamic Registry Survey.`,
      pmt
    };
  } else {
    return {
      eligible: false,
      message: "Based on your reported details, your Estimated PMT Score exceeds the qualifying threshold for Kafaalat at this time.",
      pmt,
      fallbacks
    };
  }
}

export function evaluateTaleemiWazaif(childAge: number, gender: 'boy' | 'girl', isMotherKafaalatBeneficiary: boolean): EligibilityResult {
  if (!isMotherKafaalatBeneficiary) {
    return { eligible: false, message: "You must be an active Benazir Kafaalat beneficiary to qualify for Taleemi Wazaif." };
  }

  const tw = bispData.pmt_rules.taleemi_wazaif;
  let stipend = 0;

  if (childAge >= tw.primary.age_limit_years.min && childAge <= tw.primary.age_limit_years.max) {
    stipend = gender === 'boy' ? tw.primary.boy_stipend_pkr : tw.primary.girl_stipend_pkr;
  } else if (childAge >= tw.secondary.age_limit_years.min && childAge <= tw.secondary.age_limit_years.max) {
    stipend = gender === 'boy' ? tw.secondary.boy_stipend_pkr : tw.secondary.girl_stipend_pkr;
  } else if (childAge >= tw.higher_secondary.age_limit_years.min && childAge <= tw.higher_secondary.age_limit_years.max) {
    stipend = gender === 'boy' ? tw.higher_secondary.boy_stipend_pkr : tw.higher_secondary.girl_stipend_pkr;
  } else {
    return { eligible: false, message: "The child's age does not fall within the eligible brackets (4-22 years) for Taleemi Wazaif." };
  }

  return { eligible: true, message: `Your child may qualify for Taleemi Wazaif. The quarterly stipend is ${stipend} PKR. Guideline: The mother must be an active Kafaalat beneficiary. Bring the child's B-Form and the official school admission slip to the BISP office.` };
}

export function evaluateNashonuma(isPregnantOrLactating: boolean, childAgeMonths: number, gender: 'boy' | 'girl' | null): EligibilityResult {
  const nd = bispData.pmt_rules.nashonuma;
  const guideline = "Guideline: Bring your official immunization card and visit the dedicated Nashonuma center located at your District Headquarter (DHQ) or Tehsil Headquarter (THQ) hospital.";
  
  if (isPregnantOrLactating) {
    return { eligible: true, message: `You may qualify for the Benazir Nashonuma program with a quarterly stipend of ${nd.plw_stipend_pkr} PKR. ${guideline}` };
  }
  if (childAgeMonths !== null && childAgeMonths < 24) {
    const stipend = gender === 'boy' ? nd.male_child_under_2_stipend_pkr : nd.female_child_under_2_stipend_pkr;
    return { eligible: true, message: `Your child may qualify for the Benazir Nashonuma program. The quarterly stipend is ${stipend} PKR. ${guideline}` };
  }
  return { eligible: false, message: "You must be a pregnant/lactating woman or have a child under 2 years of age to qualify for Nashonuma." };
}

export function evaluateFallback(province: string, monthlyIncome?: number): EligibilityResult {
  const fallbacks = getFallbacks(province, monthlyIncome);
  return {
    eligible: false,
    message: "Based on your situation, here are some alternative programs you may qualify for.",
    fallbacks
  };
}

export function evaluateScholarship(hasPublicUniversityAdmission: boolean, monthlyIncome: number, familySize?: number, hasAssets?: boolean, province?: string): EligibilityResult {
  const pmt = calculateMockPMT(monthlyIncome, familySize, hasAssets, province);
  const eligible = pmt.score <= BISP_PMT_CUTOFF;
  const us = bispData.pmt_rules.undergraduate_scholarship;
  const fallbacks = getFallbacks(province, monthlyIncome);
  const guideline = "Guideline: You must provide your official admission letter from an HEC-recognized public university and apply through the Ehsaas/BISP online portal.";
  
  if (eligible && hasPublicUniversityAdmission) {
    return { eligible: true, message: `You may qualify for the Benazir Undergraduate Scholarship. It covers ${us.tuition_coverage_percent}% of your tuition fee and provides a living stipend. ${guideline}`, pmt };
  } else if (!hasPublicUniversityAdmission) {
    return { eligible: false, message: "To qualify for the Undergraduate Scholarship, you must first secure admission to an HEC-recognized public sector university on open merit.", pmt, fallbacks };
  } else {
    return { eligible: false, message: "Based on your Estimated PMT Score, you may exceed the financial threshold for the Scholarship.", pmt, fallbacks };
  }
}

export function evaluateBachat(isKafaalatBeneficiary: boolean, monthlyIncome: number): EligibilityResult {
  const pmt = calculateMockPMT(monthlyIncome);
  const eligible = isKafaalatBeneficiary || pmt.score <= BISP_PMT_CUTOFF;
  const bs = bispData.pmt_rules.bachat_scheme;
  
  if (eligible) {
    return { eligible: true, message: `You may qualify for the Benazir Bachat Scheme. The government provides an additional ${bs.government_match_percent}% profit match on your savings.`, pmt };
  } else {
    return { eligible: false, message: "The Benazir Bachat Scheme is specifically designed to encourage savings among current Kafaalat beneficiaries and low-income workers.", pmt };
  }
}
