import { BispCalculator } from '../rules-engine/bisp-calculator';
import { HouseholdProfile } from '../types';

describe('BISP Waterfall Calculation Router', () => {
  it('Test Case 1 (Kafaalat Eligible): Should return 14,500 PKR stipend for standard low-income threshold profile', () => {
    const profile: HouseholdProfile = {
      householdIncome: 15000,
      maritalStatus: 'Widowed',
      childDependencyMetrics: '3 children, school-going',
      provinceOfResidence: 'Punjab'
    };
    
    const result = BispCalculator.calculateEcosystemEligibility(profile);
    
    expect(result.kafaalat.eligible).toBe(true);
    expect(result.kafaalat.stipendAmount).toBe(14500);
    expect(result.waterfallSummary).toContain('Kafaalat');
  });

  it('Test Case 2 (Waterfall Cascade): Should fail baseline Kafaalat and trigger Sehat Sahulat and Akhuwat Microfinance fallbacks', () => {
    const profile: HouseholdProfile = {
      householdIncome: 55000,
      maritalStatus: 'Married',
      childDependencyMetrics: '2 children, school-going',
      provinceOfResidence: 'Sindh',
      vulnerabilityMarkers: ['Diabetes', 'Asthma'],
      enterpriseSkills: 'Tailoring and sewing experience'
    };
    
    const result = BispCalculator.calculateEcosystemEligibility(profile);
    
    // Validate Kafaalat Failure
    expect(result.kafaalat.eligible).toBe(false);
    expect(result.kafaalat.stipendAmount).toBe(0);

    // Validate Waterfall Cascade logic triggers the fallbacks
    expect(result.sehatSahulat.eligible).toBe(true);
    expect(result.akhuwatMicrofinance.eligible).toBe(true);

    // Validate textual explanation is correctly generated for UI
    expect(result.waterfallSummary).toContain('Kafaalat failed.');
    expect(result.waterfallSummary).toContain('Routing to Sehat Sahulat');
    expect(result.waterfallSummary).toContain('Routing to Akhuwat');
  });
});
