export interface BeneficiaryData {
  cnic: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  pmtScore: number;
  isPLW?: boolean; // Pregnant or Lactating Woman
  dependents: Dependent[];
}

export interface Dependent {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  isPLW?: boolean;
}

export interface BispProgramEligibility {
  isEligibleForKafaalat: boolean;
  isEligibleForNashonuma: boolean;
  totalStipendPKR: number;
  breakdown: {
    kafaalat: number;
    nashonuma: number;
  };
}

export interface PmtRules {
  cutoff_score: number;
  programs: {
    kafaalat: {
      stipend: number;
      eligibility: {
        max_pmt: number;
        requires_female_head: boolean;
        marital_status_allowed: string[];
      };
    };
    nashonuma: {
      stipends: {
        plw_or_male_child: number;
        female_child: number;
      };
      eligibility: {
        max_pmt: number;
        requires_kafaalat_eligible: boolean;
        target_groups: string[];
      };
    };
  };
}

export interface HouseholdProfile {
  householdIncome: number;
  maritalStatus: string;
  childDependencyMetrics: string;
  provinceOfResidence: string;
  vulnerabilityMarkers?: string[];
  microEnterpriseFeasibility?: boolean;
  enterpriseSkills?: string;
}

export interface CalculationResultMatrix {
  estimatedPmtScore: number;
  kafaalat: {
    eligible: boolean;
    stipendAmount: number;
    reasoning: string;
  };
  nashonuma: {
    eligible: boolean;
    stipendAmount: number;
    reasoning: string;
  };
  sehatSahulat: {
    eligible: boolean;
    reasoning: string;
  };
  akhuwatMicrofinance: {
    eligible: boolean;
    reasoning: string;
  };
  waterfallSummary: string;
}
