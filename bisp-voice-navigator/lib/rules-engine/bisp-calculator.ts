import { BeneficiaryData, BispProgramEligibility, PmtRules, HouseholdProfile, CalculationResultMatrix } from '../types';
import rulesData from '../../data/knowledge_base/pmt_rules.json';

const pmtRules = rulesData as PmtRules;

export class BispCalculator {
  static calculateEligibility(beneficiary: BeneficiaryData): BispProgramEligibility {
    let kafaalatStipend = 0;
    let nashonumaStipend = 0;
    let isEligibleForKafaalat = false;
    let isEligibleForNashonuma = false;

    // Check Kafaalat eligibility
    if (
      beneficiary.pmtScore <= pmtRules.programs.kafaalat.eligibility.max_pmt &&
      beneficiary.gender === 'Female' &&
      pmtRules.programs.kafaalat.eligibility.marital_status_allowed.includes(beneficiary.maritalStatus)
    ) {
      isEligibleForKafaalat = true;
      kafaalatStipend = pmtRules.programs.kafaalat.stipend;
    }

    // Check Nashonuma eligibility
    if (isEligibleForKafaalat) {
      // Check if beneficiary herself is PLW
      if (beneficiary.isPLW) {
        isEligibleForNashonuma = true;
        nashonumaStipend += pmtRules.programs.nashonuma.stipends.plw_or_male_child;
      }

      // Check dependents
      for (const dependent of beneficiary.dependents) {
        if (dependent.isPLW) {
          isEligibleForNashonuma = true;
          nashonumaStipend += pmtRules.programs.nashonuma.stipends.plw_or_male_child;
        } else if (dependent.age <= 2) {
          isEligibleForNashonuma = true;
          if (dependent.gender === 'Female') {
            nashonumaStipend += pmtRules.programs.nashonuma.stipends.female_child;
          } else {
            nashonumaStipend += pmtRules.programs.nashonuma.stipends.plw_or_male_child;
          }
        }
      }
    }

    return {
      isEligibleForKafaalat,
      isEligibleForNashonuma,
      totalStipendPKR: kafaalatStipend + nashonumaStipend,
      breakdown: {
        kafaalat: kafaalatStipend,
        nashonuma: nashonumaStipend
      }
    };
  }

  static calculateEcosystemEligibility(profile: HouseholdProfile): CalculationResultMatrix {
    // 1. Calculate an estimated PMT score based on basic household income proxy
    // (This is a simplified mock logic to represent the PMT computation)
    let estimatedPmtScore = 50; 
    if (profile.householdIncome < 20000) {
      estimatedPmtScore = 15;
    } else if (profile.householdIncome < 30000) {
      estimatedPmtScore = 28;
    } else if (profile.householdIncome < 50000) {
      estimatedPmtScore = 35;
    } else {
      estimatedPmtScore = 50;
    }

    // Additional penalties for PMT score
    if (profile.maritalStatus === 'Widowed' || profile.maritalStatus === 'Divorced') {
      estimatedPmtScore -= 5;
    }

    // 2. Kafaalat Eligibility Check
    let kafaalatEligible = false;
    let kafaalatStipend = 0;
    let kafaalatReasoning = 'Income exceeds threshold, resulting in high PMT score.';
    
    if (estimatedPmtScore <= pmtRules.cutoff_score) {
      kafaalatEligible = true;
      kafaalatStipend = pmtRules.programs.kafaalat.stipend;
      kafaalatReasoning = `Eligible for Kafaalat with estimated PMT score (${estimatedPmtScore}) <= ${pmtRules.cutoff_score}.`;
    }

    // 3. Nashonuma Eligibility Check
    let nashonumaEligible = false;
    let nashonumaStipend = 0;
    let nashonumaReasoning = 'Not eligible. Nashonuma requires Kafaalat eligibility.';

    if (kafaalatEligible && profile.childDependencyMetrics.toLowerCase().includes('pregnant') || profile.childDependencyMetrics.toLowerCase().includes('under 2')) {
      nashonumaEligible = true;
      // Rough approximation based on child dependency metrics text
      nashonumaStipend = pmtRules.programs.nashonuma.stipends.plw_or_male_child; 
      nashonumaReasoning = 'Eligible due to presence of PLW or child under 2 in household context.';
    }

    // 4. Sehat Sahulat (Fallback/Medical) Check
    let sehatSahulatEligible = false;
    let sehatSahulatReasoning = 'Standard healthcare coverage available. Additional coverage unnecessary.';
    
    if (profile.vulnerabilityMarkers && profile.vulnerabilityMarkers.length > 0) {
      sehatSahulatEligible = true;
      sehatSahulatReasoning = `Eligible for Sehat Sahulat priority due to markers: ${profile.vulnerabilityMarkers.join(', ')}.`;
    } else if (!kafaalatEligible && profile.householdIncome < 60000) {
       sehatSahulatEligible = true;
       sehatSahulatReasoning = 'Provided as a fallback safety net due to lack of Kafaalat eligibility despite low-middle income.';
    }

    // 5. Akhuwat Microfinance Check
    let akhuwatEligible = false;
    let akhuwatReasoning = 'No micro-enterprise skills or feasibility indicated.';

    if (profile.microEnterpriseFeasibility || (profile.enterpriseSkills && profile.enterpriseSkills.length > 5)) {
      akhuwatEligible = true;
      akhuwatReasoning = 'Eligible for Akhuwat interest-free loans based on enterprise skills and feasibility.';
    } else if (!kafaalatEligible && estimatedPmtScore > pmtRules.cutoff_score && estimatedPmtScore < 45) {
      akhuwatEligible = true;
      akhuwatReasoning = 'Fallback: Recommended for micro-enterprise loan to build income generation since cash stipends were rejected.';
    }

    // 6. Waterfall Summary Generation
    let waterfallSummary = '';
    if (kafaalatEligible) {
      waterfallSummary = 'Primary cash stipend (Kafaalat) approved.';
      if (nashonumaEligible) waterfallSummary += ' Conditional health/nutrition (Nashonuma) stipend approved.';
    } else {
      waterfallSummary = 'Kafaalat failed. ';
      if (sehatSahulatEligible) waterfallSummary += 'Routing to Sehat Sahulat for health coverage. ';
      if (akhuwatEligible) waterfallSummary += 'Routing to Akhuwat for microfinance enterprise loan.';
    }

    return {
      estimatedPmtScore,
      kafaalat: {
        eligible: kafaalatEligible,
        stipendAmount: kafaalatStipend,
        reasoning: kafaalatReasoning
      },
      nashonuma: {
        eligible: nashonumaEligible,
        stipendAmount: nashonumaStipend,
        reasoning: nashonumaReasoning
      },
      sehatSahulat: {
        eligible: sehatSahulatEligible,
        reasoning: sehatSahulatReasoning
      },
      akhuwatMicrofinance: {
        eligible: akhuwatEligible,
        reasoning: akhuwatReasoning
      },
      waterfallSummary: waterfallSummary.trim()
    };
  }
}
