"""
MannuMitra - Farmer Support & Welfare Schemes Directory
Indexes verified central and Karnataka state agricultural schemes, credit portals, subsidies, and PMFBY insurance.
Every entry records eligibility, official source, direct action links, required documents, and verification metadata.
"""

from typing import List, Dict, Any, Optional

GOVERNMENT_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "pm_kisan",
        "name_en": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "name_kn": "ಪಿಎಂ-ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ",
        "department": "Ministry of Agriculture & Farmers Welfare",
        "provider": "Ministry of Agriculture & Farmers Welfare, Govt of India",
        "category": "Income Support",
        "category_kn": "ಆದಾಯ ಬೆಂಬಲ",
        "level": "Central",
        "level_kn": "ಕೇಂದ್ರ ಸರ್ಕಾರ",
        "benefit": "Rs 6,000 per year provided in three 4-monthly installments of Rs 2,000 deposited directly via DBT into Aadhaar-seeded bank accounts.",
        "benefit_kn": "ವರ್ಷಕ್ಕೆ ₹6,000 ನೇರ ಆದಾಯ ಬೆಂಬಲ (ಪ್ರತಿ 4 ತಿಂಗಳಿಗೊಮ್ಮೆ ₹2,000 ರಂತೆ ಮೂರು ಕಂತುಗಳಲ್ಲಿ ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆ).",
        "eligibility": "All landholding farmer families with cultivable land in their names (subject to exclusion criteria such as institutional landholders and high-income taxpayers).",
        "eligibility_kn": "ತಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಸಾಗುವಳಿ ಭೂಮಿ ಹೊಂದಿರುವ ಎಲ್ಲಾ ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತ ಕುಟುಂಬಗಳು (ಸಾಂಸ್ಥಿಕ ಭೂಹಿಡುವಳಿದಾರರು ಹಾಗೂ ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿದಾರರನ್ನು ಹೊರತುಪಡಿಸಿ).",
        "documents": [
            "Aadhaar Card",
            "Land Holding Record (Bhoomi RTC / Pahani)",
            "Aadhaar-seeded Bank Account Passbook",
            "Active Mobile Number for e-KYC"
        ],
        "documents_kn": [
            "ಆಧಾರ್ ಕಾರ್ಡ್",
            "ಭೂಮಿ ಪಹಣಿ / ಆರ್‌ಟಿಸಿ (RTC)",
            "ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಖಾತೆ ಪಾಸ್‌ಬುಕ್",
            "ಇ-ಕೆವೈಸಿಗಾಗಿ ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
        ],
        "official_source": "https://pmkisan.gov.in/",
        "application_url": "https://pmkisan.gov.in/",
        "action_label_en": "Open PM-KISAN Portal",
        "action_label_kn": "ಪಿಎಂ-ಕಿಸಾನ್ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active (Ongoing DBT Tranches)",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Visit the official PM-KISAN portal (https://pmkisan.gov.in/).",
            "Click on 'Farmers Corner' and select 'New Farmer Registration'.",
            "Complete mandatory Aadhaar-based OTP e-KYC authentication.",
            "Verify your land survey number matches the Bhoomi RTC database.",
            "Track beneficiary installment status using your registration number."
        ],
        "next_steps_kn": [
            "ಅಧಿಕೃತ ಪಿಎಂ-ಕಿಸಾನ್ ಪೋರ್ಟಲ್ (https://pmkisan.gov.in/) ಗೆ ಭೇಟಿ ನೀಡಿ.",
            "'Farmers Corner' ವಿಭಾಗದಲ್ಲಿ 'New Farmer Registration' ಆಯ್ಕೆಮಾಡಿ.",
            "ಆಧಾರ್ ಆಧಾರಿತ ಮೊಬೈಲ್ ಇ-ಕೆವೈಸಿ (e-KYC) ಪ್ರಕ್ರಿಯೆ ಪೂರ್ಣಗೊಳಿಸಿ.",
            "ಭೂಮಿ ಆರ್‌ಟಿಸಿ ಪಹಣಿ ಸರ್ವೆ ಸಂಖ್ಯೆ ತಾಳೆಯಾಗುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
            "ನೋಂದಣಿ ಸಂಖ್ಯೆ ಬಳಸಿ ಕಂತುಗಳ ಜಮೆ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ."
        ]
    },
    {
        "id": "pmfby",
        "name_en": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        "name_kn": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (ಬೆಳೆ ವಿಮೆ)",
        "department": "Ministry of Agriculture & Farmers Welfare & Karnataka Agri Dept",
        "provider": "Department of Agriculture & Farmers Welfare, GoI & Govt of Karnataka",
        "category": "Crop Insurance",
        "category_kn": "ಬೆಳೆ ವಿಮೆ",
        "level": "Central & Karnataka Joint",
        "level_kn": "ಕೇಂದ್ರ & ರಾಜ್ಯ ಜಂಟಿ",
        "benefit": "Comprehensive financial insurance against non-preventable natural risks (drought, flood, cyclone, pests, post-harvest losses). Farmers pay nominal premium share: 2.0% for Kharif food/oilseeds, 1.5% for Rabi food/oilseeds, and 5.0% for annual commercial/horticultural crops; balance is subsidized by Central and State Governments.",
        "benefit_kn": "ಅನಾವೃಷ್ಟಿ, ಅತಿವೃಷ್ಟಿ, ಕೀಟಬಾಧೆ ಹಾಗೂ ನೈಸರ್ಗಿಕ ವಿಕೋಪಗಳಿಂದ ಉಂಟಾಗುವ ಬೆಳೆ ನಷ್ಟಕ್ಕೆ ಸಮಗ್ರ ಆರ್ಥಿಕ ರಕ್ಷಣೆ. ರೈತರು ಪಾವತಿಸಬೇಕಾದ ಪ್ರೀಮಿಯಂ: ಖಾರಿಫ್ ಬೆಳೆಗೆ ಕೇವಲ 2%, ರಬಿ ಬೆಳೆಗೆ 1.5% ಮತ್ತು ವಾಣಿಜ್ಯ/ತೋಟಗಾರಿಕೆ ಬೆಳೆಗಳಿಗೆ 5%.",
        "eligibility": "All farmers growing notified crops in notified insurance units/taluks for the current season, including loanee farmers, non-loanee farmers, sharecroppers, and tenant cultivators.",
        "eligibility_kn": "ಪ್ರಸಕ್ತ ಹಂಗಾಮಿನಲ್ಲಿ ಸರ್ಕಾರದಿಂದ ಅಧಿಸೂಚಿಸಲ್ಪಟ್ಟ ಬೆಳೆಗಳನ್ನು ಮತ್ತು ಅಧಿಸೂಚಿತ ತಾಲೂಕು/ಗ್ರಾಮಗಳಲ್ಲಿ ಬೆಳೆಯುವ ಎಲ್ಲಾ ರೈತರು (ಸಾಲ ಪಡೆದ, ಸಾಲ ಪಡೆಯದ ಹಾಗೂ ಗೇಣಿ ರೈತರು).",
        "documents": [
            "Bhoomi RTC / Pahani showing notified crop sowing",
            "Sowing Certificate issued by Village Accountant / Self-declaration",
            "Bank Account Passbook (IFSC & Account number)",
            "Aadhaar Card"
        ],
        "documents_kn": [
            "ಬೆಳೆ ನಮೂದಾಗಿರುವ ಪ್ರಸಕ್ತ ಸಾಲಿನ ಭೂಮಿ ಪಹಣಿ (RTC)",
            "ಗ್ರಾಮ ಆಡಳಿತಾಧಿಕಾರಿ ನೀಡಿದ ಬಿತ್ತನೆ ದೃಢೀಕರಣ ಪತ್ರ / ಸ್ವಯಂ ಘೋಷಣೆ",
            "ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ (IFSC ಕೋಡ್ ಸಮೇತ)",
            "ಆಧಾರ್ ಕಾರ್ಡ್"
        ],
        "official_source": "https://pmfby.gov.in/",
        "application_url": "https://pmfby.gov.in/",
        "calculator_url": "https://pmfby.gov.in/premiumCalculator",
        "status_url": "https://pmfby.gov.in/applicationStatus",
        "state_portal_url": "https://samrakshane.karnataka.gov.in/",
        "helpline": "14447 (National Krishi Rakshak Helpline)",
        "action_label_en": "Apply on PMFBY Portal",
        "action_label_kn": "ಪಿಎಂಎಫ್‌ಬಿವೈ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active (Season Dependent)",
        "applicable_crops": ["rice", "ragi", "maize", "cotton", "groundnut", "turmeric", "onion", "tomato"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Verify that your crop and taluk are notified for the current Kharif/Rabi season.",
            "Use the official PMFBY Premium Calculator (https://pmfby.gov.in/premiumCalculator) to estimate your exact premium.",
            "Apply online through PMFBY / Samrakshane portal or visit your nearest Common Service Centre (CSC) / bank branch.",
            "Submit your RTC/Pahani and sowing certificate before the season cut-off deadline.",
            "In case of localized crop loss, report within 72 hours via the Crop Insurance App or call toll-free 14447."
        ],
        "next_steps_kn": [
            "ಪ್ರಸಕ್ತ ಹಂಗಾಮಿನಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ತಾಲೂಕು ಅಧಿಸೂಚಿಸಲ್ಪಟ್ಟಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
            "ಅಧಿಕೃತ ಪ್ರೀಮಿಯಂ ಕ್ಯಾಲ್ಕುಲೇಟರ್ (https://pmfby.gov.in/premiumCalculator) ಬಳಸಿ ಪ್ರೀಮಿಯಂ ಲೆಕ್ಕ ಹಾಕಿ.",
            "ಪಿಎಂಎಫ್‌ಬಿವೈ ಅಥವಾ ಕರ್ನಾಟಕ ಸಂರಕ್ಷಣೆ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅಥವಾ ಸಮೀಪದ ಸಿಎಸ್‌ಸಿ/ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            "ನಿಗದಿಪಡಿಸಿದ ಅಂತಿಮ ದಿನಾಂಕದೊಳಗೆ ಪಹಣಿ ಮತ್ತು ಬಿತ್ತನೆ ದೃಢೀಕರಣ ಸಲ್ಲಿಸಿ.",
            "ಬೆಳೆ ನಷ್ಟ ಸಂಭವಿಸಿದಲ್ಲಿ 72 ಗಂಟೆಗಳ ಒಳಗೆ ಕ್ರಾಪ್ ಇನ್ಶುರೆನ್ಸ್ ಆ್ಯಪ್ ಅಥವಾ 14447 ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ ವರದಿ ಮಾಡಿ."
        ]
    },
    {
        "id": "soil_health_card",
        "name_en": "Soil Health Card Scheme",
        "name_kn": "ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಯೋಜನೆ",
        "department": "Department of Agriculture & Cooperation, Ministry of Agriculture",
        "provider": "Department of Agriculture, Govt of India & Govt of Karnataka",
        "category": "Soil Health",
        "category_kn": "ಮಣ್ಣಿನ ಆರೋಗ್ಯ",
        "level": "Central & State Joint",
        "level_kn": "ಕೇಂದ್ರ & ರಾಜ್ಯ ಜಂಟಿ",
        "benefit": "Periodic issuance of customized Soil Health Cards evaluating 12 key soil fertility parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, Organic Carbon) along with precise crop-wise fertilizer dosage recommendations to avoid soil degradation and cut input costs.",
        "benefit_kn": "ಮಣ್ಣಿನ 12 ಪ್ರಮುಖ ಪೋಷಕಾಂಶಗಳ (NPK, ಲಘು ಪೋಷಕಾಂಶಗಳು, pH, ಲವಣಾಂಶ, ಇಂಗಾಲ) ಸಮಗ್ರ ಪರೀಕ್ಷೆ ನಡೆಸಿ ಬೆಳೆವಾರು ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ ಮತ್ತು ಸುಧಾರಣಾ ಕ್ರಮಗಳ ವೈಜ್ಞಾನಿಕ ವರದಿ ನೀಡಿಕೆ.",
        "eligibility": "All agricultural landowners and cultivators in Karnataka.",
        "eligibility_kn": "ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಸಾಗುವಳಿ ಜಮೀನು ಹೊಂದಿರುವ ರೈತರು.",
        "documents": [
            "Land Survey Number & Hissa details",
            "Representative Soil Sample (0-15 cm core depth)",
            "Aadhaar Card"
        ],
        "documents_kn": [
            "ಜಮೀನಿನ ಸರ್ವೆ ನಂಬರ್ ಮತ್ತು ಹಿಸ್ಸಾ ವಿವರ",
            "ಹೊಲದಿಂದ ಸಂಗ್ರಹಿಸಿದ ಪ್ರತಿನಿಧಿ ಮಣ್ಣಿನ ಮಾದರಿ",
            "ಆಧಾರ್ ಕಾರ್ಡ್"
        ],
        "official_source": "https://soilhealth.dac.gov.in/",
        "application_url": "https://soilhealth.dac.gov.in/",
        "action_label_en": "Open Soil Health Portal",
        "action_label_kn": "ಮಣ್ಣು ಆರೋಗ್ಯ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Collect a composite topsoil sample (0-15 cm depth) from your field following standard grid sampling.",
            "Submit the labeled sample to your nearest Raitha Samparka Kendra (RSK) or District Soil Testing Laboratory.",
            "Access the official portal (https://soilhealth.dac.gov.in/) to track sample testing progress.",
            "Download your official Soil Health Card and adopt UAS recommended fertilizer splits."
        ],
        "next_steps_kn": [
            "ಹೊಲದ ವಿವಿಧ ಭಾಗಗಳಿಂದ 0-15 ಸೆಂ.ಮೀ ಆಳದ ಮಣ್ಣಿನ ಮಾದರಿ ಸಂಗ್ರಹಿಸಿ ಮಿಶ್ರಣ ಮಾಡಿ.",
            "ಮಾದರಿಯನ್ನು ನಿಮ್ಮ ಸಮೀಪದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಅಥವಾ ಜಿಲ್ಲಾ ಮಣ್ಣು ಪರೀಕ್ಷಾ ಕೇಂದ್ರಕ್ಕೆ ನೀಡಿ.",
            "ಅಧಿಕೃತ ಪೋರ್ಟಲ್ (https://soilhealth.dac.gov.in/) ನಲ್ಲಿ ಪರೀಕ್ಷಾ ಪ್ರಗತಿ ವೀಕ್ಷಿಸಿ.",
            "ನಿಮ್ಮ ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಕೃಷಿ ವಿವಿ ಶಿಫಾರಸಿನಂತೆ ಗೊಬ್ಬರ ಬಳಸಿ."
        ]
    },
    {
        "id": "jansamarth",
        "name_en": "JanSamarth (National Credit-Linked Schemes Portal)",
        "name_kn": "ಜನ್‌ಸಮರ್ಥ್ (ಕೃಷಿ ಮತ್ತು ಕೃಷಿ ಪೂರಕ ಸಾಲ ಪೋರ್ಟಲ್)",
        "department": "Department of Financial Services, Ministry of Finance",
        "provider": "Ministry of Finance & Ministry of Agriculture, Govt of India",
        "category": "Credit & Loans",
        "category_kn": "ಕೃಷಿ ಸಾಲ & ಸೌಲಭ್ಯಗಳು",
        "level": "Central",
        "level_kn": "ಕೇಂದ್ರ ಸರ್ಕಾರ",
        "benefit": "Digital single-window platform directly connecting farmers and agri-entrepreneurs to 13+ credit-linked government subsidy schemes including Agriculture Infrastructure Fund (AIF), Agricultural Marketing Infrastructure (AMI), and dairy/animal husbandry loans with digital in-principle approval.",
        "benefit_kn": "ಕೃಷಿ ಮೂಲಸೌಕರ್ಯ ನಿಧಿ (AIF), ಮಾರುಕಟ್ಟೆ ಸೌಲಭ್ಯ ಮತ್ತು ಹೈನುಗಾರಿಕೆ ಯೋಜನೆಗಳ ಸಾಲ-ಸಬ್ಸಿಡಿ ಸೌಲಭ್ಯಗಳಿಗೆ ಏಕಗವಾಕ್ಷಿ ಡಿಜಿಟಲ್ ಅರ್ಜಿ ಹಾಗೂ ತ್ವರಿತ ತಾತ್ವಿಕ ಅನುಮೋದನೆ.",
        "eligibility": "Farmers, FPOs, Agri-startups, Self-Help Groups, and Agricultural Cooperatives.",
        "eligibility_kn": "ರೈತರು, ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆಗಳು (FPO), ಕೃಷಿ ಉದ್ಯಮಿಗಳು ಹಾಗೂ ಸಹಕಾರ ಸಂಘಗಳು.",
        "documents": [
            "Aadhaar Card & PAN Card",
            "Bank Account Statement (last 6 months)",
            "Land RTC / Proof of Agricultural Asset",
            "Project Proposal (for infrastructure/post-harvest loans)"
        ],
        "documents_kn": [
            "ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಪ್ಯಾನ್ ಕಾರ್ಡ್",
            "ಕಳೆದ 6 ತಿಂಗಳ ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ",
            "ಜಮೀನಿನ ಪಹಣಿ / ಕೃಷಿ ಆಸ್ತಿ ದಾಖಲೆ",
            "ಯೋಜನಾ ವರದಿ (ಕೃಷಿ ಗೋದಾಮು/ಸಂಸ್ಕರಣಾ ಘಟಕಗಳಿಗೆ)"
        ],
        "official_source": "https://www.jansamarth.in/home",
        "application_url": "https://www.jansamarth.in/home",
        "action_label_en": "Check Credit Eligibility on JanSamarth",
        "action_label_kn": "ಜನ್‌ಸಮರ್ಥ್‌ನಲ್ಲಿ ಸಾಲ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Open the JanSamarth official portal (https://www.jansamarth.in/home).",
            "Select 'Agri Infrastructure & Marketing' or 'Allied Agricultural Loans'.",
            "Complete basic questionnaire to identify matching credit schemes.",
            "Upload KYC documents and submit for digital in-principle sanction.",
            "Visit chosen partner bank branch with the digital approval letter."
        ],
        "next_steps_kn": [
            "ಜನ್‌ಸಮರ್ಥ್ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ (https://www.jansamarth.in/home) ತೆರೆಯಿರಿ.",
            "'Agri Infrastructure' ಅಥವಾ ಕೃಷಿ ಪೂರಕ ಸಾಲ ವಿಭಾಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            "ಅರ್ಹತೆ ಪರಿಶೀಲನಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ ಸೂಕ್ತ ಯೋಜನೆಯನ್ನು ಗುರುತಿಸಿ.",
            "ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಡಿಜಿಟಲ್ ತಾತ್ವಿಕ ಅನುಮೋದನೆ ಪತ್ರ ಪಡೆಯಿರಿ.",
            "ಆಯ್ಕೆ ಮಾಡಿದ ಬ್ಯಾಂಕ್ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡಿ ಸಾಲ ಪ್ರಕ್ರಿಯೆ ಪೂರ್ಣಗೊಳಿಸಿ."
        ]
    },
    {
        "id": "kisan_credit_card",
        "name_en": "Kisan Rin Portal (KCC / Crop Credit Facility)",
        "name_kn": "ಕಿಸಾನ್ ಋಣ ಪೋರ್ಟಲ್ (ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ - ಕೆಸಿಸಿ)",
        "department": "Ministry of Agriculture & Farmers Welfare & NABARD",
        "provider": "Government of India, NABARD, Commercial & Cooperative Banks",
        "category": "Credit & Loans",
        "category_kn": "ಕೃಷಿ ಸಾಲ & ಸೌಲಭ್ಯಗಳು",
        "level": "Central & Banking System",
        "level_kn": "ಕೇಂದ್ರ ಸರ್ಕಾರ & ಬ್ಯಾಂಕಿಂಗ್",
        "benefit": "Short-term production credit up to Rs 3,00,000 at a concessional interest rate of 7% p.a., with an additional 3% Prompt Repayment Incentive (PRI), resulting in an effective interest rate of only 4% per annum. Flexible revolving cash credit for seeds, fertilizers, and operational crop maintenance.",
        "benefit_kn": "₹3 ಲಕ್ಷದವರೆಗಿನ ಅಲ್ಪಾವಧಿ ಬೆಳೆ ಸಾಲಕ್ಕೆ ರಿಯಾಯಿತಿ ಬಡ್ಡಿದರ 7%, ಸಕಾಲದಲ್ಲಿ ಮರುಪಾವತಿಸಿದರೆ 3% ಬಡ್ಡಿ ಸಹಾಯಧನ ಲಭ್ಯವಿದ್ದು, ಕೇವಲ 4% ನಿವ್ವಳ ಬಡ್ಡಿದರದಲ್ಲಿ ಸಾಲ ಸೌಲಭ್ಯ.",
        "eligibility": "Owner cultivators, tenant farmers, oral lessees, sharecroppers, and SHG/JLG farmer groups cultivating seasonal crops.",
        "eligibility_kn": "ಸ್ವಂತ ಜಮೀನು ಹೊಂದಿರುವ ರೈತರು, ಗೇಣಿದಾರರು ಹಾಗೂ ಜಂಟಿ ಬಾಧ್ಯತಾ ಸಂಘಗಳ (JLG) ಸದಸ್ಯರು.",
        "documents": [
            "Land RTC / Bhoomi Pahani showing title and cultivation",
            "No Dues Certificate / PACS declaration",
            "Aadhaar Card and PAN Card",
            "Passport-size Photographs"
        ],
        "documents_kn": [
            "ಪ್ರಸಕ್ತ ಸಾಲಿನ ಭೂಮಿ ಪಹಣಿ (RTC)",
            "ಬಾಕಿ ಇಲ್ಲದ ದೃಢೀಕರಣ ಪತ್ರ (No Dues Certificate)",
            "ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಪ್ಯಾನ್ ಕಾರ್ಡ್",
            "ಪಾಸ್‌ಪೋರ್ಟ್ ಅಳತೆಯ ಭಾವಚಿತ್ರಗಳು"
        ],
        "official_source": "https://fasalrin.gov.in/",
        "application_url": "https://fasalrin.gov.in/",
        "action_label_en": "Open Kisan Rin Portal",
        "action_label_kn": "ಕಿಸಾನ್ ಋಣ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Visit the official Kisan Rin Portal (https://fasalrin.gov.in/) to review guidelines and partner bank branches.",
            "Obtain your current season RTC/Pahani from Bhoomi portal.",
            "Submit the unified KCC application form to your local Commercial Bank, RRB (KVGB/PKGB), or PACS.",
            "Ensure prompt repayment within 12 months to avail the 3% interest subvention discount."
        ],
        "next_steps_kn": [
            "ಕಿಸಾನ್ ಋಣ ಪೋರ್ಟಲ್ (https://fasalrin.gov.in/) ನಲ್ಲಿ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "ಭೂಮಿ ಪೋರ್ಟಲ್‌ನಿಂದ ಚಾಲ್ತಿ ಸಾಲಿನ ಪಹಣಿ (RTC) ಪಡೆದುಕೊಳ್ಳಿ.",
            "ಸ್ಥಳೀಯ ಗ್ರಾಮೀಣ ಬ್ಯಾಂಕ್ (PKGB/KVGB), ವಾಣಿಜ್ಯ ಬ್ಯಾಂಕ್ ಅಥವಾ ಡಿಸಿಸಿ ಬ್ಯಾಂಕ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            "4% ಬಡ್ಡಿದರದ ಸೌಲಭ್ಯ ಪಡೆಯಲು 12 ತಿಂಗಳ ಒಳಗೆ ಸಾಲ ಮರುಪಾವತಿ ಮಾಡಿ."
        ]
    },
    {
        "id": "enam",
        "name_en": "e-NAM (National Agriculture Market)",
        "name_kn": "ಇ-ನ್ಯಾಮ್ (ರಾಷ್ಟ್ರೀಯ ಕೃಷಿ ಇ-ಮಾರುಕಟ್ಟೆ)",
        "department": "Small Farmers Agribusiness Consortium (SFAC), Ministry of Agriculture",
        "provider": "Ministry of Agriculture & Farmers Welfare, GoI & Karnataka APMCs",
        "category": "Market Access",
        "category_kn": "ಮಾರುಕಟ್ಟೆ ಸಂಪರ್ಕ",
        "level": "Central & State Joint",
        "level_kn": "ಕೇಂದ್ರ & ರಾಜ್ಯ ಜಂಟಿ",
        "benefit": "Pan-India electronic trading portal integrating 1,361+ wholesale APMC mandis. Offers transparent electronic price discovery, standardized digital assaying/quality testing, online competitive bidding by national buyers, and secure DBT payout directly to farmer bank accounts.",
        "benefit_kn": "ದೇಶಾದ್ಯಂತ 1,361+ ಕೃಷಿ ಉತ್ಪನ್ನ ಮಾರುಕಟ್ಟೆಗಳನ್ನು (APMC) ಸಂಪರ್ಕಿಸುವ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್. ಪಾರದರ್ಶಕ ಇ-ಹರಾಜು, ನಿಖರ ತೂಕ ಮತ್ತು ನೇರ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಮಾರಾಟದ ಹಣ ಜಮೆ.",
        "eligibility": "Any farmer or farmer producer organization (FPO) wishing to sell agricultural produce transparently.",
        "eligibility_kn": "ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಮಾರಾಟ ಮಾಡಲು ಇಚ್ಛಿಸುವ ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ರೈತರು ಮತ್ತು ಎಫ್‌ಪಿಒಗಳು.",
        "documents": [
            "Bank Account Passbook (with IFSC code)",
            "Aadhaar Card",
            "Mobile Number registered with e-NAM",
            "Mandi Lot Inward Slip"
        ],
        "documents_kn": [
            "ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ (IFSC ಕೋಡ್ ಸಮೇತ)",
            "ಆಧಾರ್ ಕಾರ್ಡ್",
            "ಇ-ನ್ಯಾಮ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಲಾದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
            "ಮಾರುಕಟ್ಟೆ ಪ್ರವೇಶ ರಶೀದಿ (Gate Entry Slip)"
        ],
        "official_source": "https://enam.gov.in/web/",
        "application_url": "https://enam.gov.in/web/",
        "action_label_en": "Open e-NAM Portal",
        "action_label_kn": "ಇ-ನ್ಯಾಮ್ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active (1,361+ Mandis Integrated)",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Register on the official e-NAM portal (https://enam.gov.in/web/) using your Aadhaar and bank details.",
            "Bring your harvested produce to an e-NAM integrated APMC market (e.g. Mandya, Mysuru, Kolar).",
            "Get a lot gate-entry slip and quality assaying test performed.",
            "Monitor live electronic bidding on your mobile phone.",
            "Accept the highest bid and receive payment directly into your bank account via e-payment."
        ],
        "next_steps_kn": [
            "ಅಧಿಕೃತ ಇ-ನ್ಯಾಮ್ ಪೋರ್ಟಲ್ (https://enam.gov.in/web/) ನಲ್ಲಿ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನೋಂದಾಯಿಸಿ.",
            "ಬೆಳೆಯನ್ನು ಇ-ನ್ಯಾಮ್ ಸಂಯೋಜಿತ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆಗೆ ತನ್ನಿ.",
            "ಪ್ರವೇಶ ರಶೀದಿ ಮತ್ತು ಗುಣಮಟ್ಟ ಪರೀಕ್ಷಾ ವರದಿ (Assaying) ಪಡೆದುಕೊಳ್ಳಿ.",
            "ಮೊಬೈಲ್ ಮೂಲಕ ನೈಜ ಸಮಯದ ಇ-ಹರಾಜು ಬಿಡ್ಡಿಂಗ್ ಗಮನಿಸಿ.",
            "ಹೆಚ್ಚಿನ ದರಕ್ಕೆ ಸಮ್ಮತಿಸಿ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಹಣ ಪಡೆಯಿರಿ."
        ]
    },
    {
        "id": "raitha_siri",
        "name_en": "Raitha Siri (Karnataka Millet Promotion Scheme)",
        "name_kn": "ರೈತ ಸಿರಿ (ಸಿರಿಧಾನ್ಯ ಪ್ರೋತ್ಸಾಹ ಯೋಜನೆ - ಕರ್ನಾಟಕ)",
        "department": "Department of Agriculture, Government of Karnataka",
        "provider": "Department of Agriculture, Govt of Karnataka",
        "category": "Millet Subsidy",
        "category_kn": "ಸಿರಿಧಾನ್ಯ ಪ್ರೋತ್ಸಾಹ",
        "level": "State (Karnataka)",
        "level_kn": "ಕರ್ನಾಟಕ ರಾಜ್ಯ",
        "benefit": "Direct financial incentive of Rs 10,000 per hectare (up to a maximum of 2 hectares = Rs 20,000 per farmer family) credited via DBT to farmers cultivating designated minor millets (Ragi, Foxtail/Navane, Little/Same, Kodo/Haraka, Barnyard/Oodalu, Browntop/Korale).",
        "benefit_kn": "ಸಿರಿಧಾನ್ಯಗಳಾದ ರಾಗಿ, ನವಣೆ, ಸಾಮೆ, ಹಾರಕ, ಕೊರಲೆ, ಊದಲು ಬೆಳೆಯುವ ರೈತರಿಗೆ ಪ್ರತಿ ಹೆಕ್ಟೇರ್‌ಗೆ ₹10,000 ನೇರ ಪ್ರೋತ್ಸಾಹಧನ (ಗರಿಷ್ಠ 2 ಹೆಕ್ಟೇರ್‌ಗೆ ₹20,000 ವರೆಗೆ ಡಿಬಿಟಿ ಮೂಲಕ ಖಾತೆಗೆ).",
        "eligibility": "Karnataka farmers cultivating designated millets with verified landholding registered in FRUITS database.",
        "eligibility_kn": "ಕರ್ನಾಟಕದಲ್ಲಿ ಸಿರಿಧಾನ್ಯ ಬೆಳೆಯುವ ಹಾಗೂ ಫ್ರೂಟ್ಸ್ (FRUITS) ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಣಿಯಾಗಿರುವ ಎಲ್ಲಾ ರೈತರು.",
        "documents": [
            "FRUITS Farmer ID (FID)",
            "Bhoomi RTC (Pahani) reflecting millet crop entry in current season",
            "Aadhaar-seeded Bank Account",
            "Joint Undertaking (if land is joint property)"
        ],
        "documents_kn": [
            "ಫ್ರೂಟ್ಸ್ (FRUITS) ರೈತ ಐಡಿ (FID)",
            "ಪ್ರಸಕ್ತ ಸಾಲಿನಲ್ಲಿ ಸಿರಿಧಾನ್ಯ ಬೆಳೆ ನಮೂದಾದ ಭೂಮಿ ಪಹಣಿ (RTC)",
            "ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಖಾತೆ",
            "ಜಂಟಿ ಒಪ್ಪಿಗೆ ಪತ್ರ (ಅಗತ್ಯವಿದ್ದಲ್ಲಿ)"
        ],
        "official_source": "https://raitamitra.karnataka.gov.in/",
        "application_url": "https://fruits.karnataka.gov.in/",
        "action_label_en": "Register / Apply on FRUITS Portal",
        "action_label_kn": "ಫ್ರೂಟ್ಸ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active (State Budget Approved)",
        "applicable_crops": ["ragi", "bajra", "jowar", "millet"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Ensure your farmer profile and land parcel are linked to an active FRUITS ID (FID).",
            "Ensure Village Accountant enters millet cultivation into the official crop survey (Bele Jarip).",
            "Visit your local Raitha Samparka Kendra (RSK) or open FRUITS portal (https://fruits.karnataka.gov.in/).",
            "Verify DBT payment status directly in the Karnataka DBT Farmer Portal."
        ],
        "next_steps_kn": [
            "ನಿಮ್ಮ ಜಮೀನಿನ ಆರ್‌ಟಿಸಿಗೆ ಫ್ರೂಟ್ಸ್ ಐಡಿ (FRUITS FID) ಜೋಡಣೆಯಾಗಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
            "ಬೆಳೆ ಸಮೀಕ್ಷೆಯಲ್ಲಿ (Bele Jarip) ಸಿರಿಧಾನ್ಯ ಬೆಳೆ ನಿಖರವಾಗಿ ದಾಖಲಾಗಿರುವುದನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "ಸ್ಥಳೀಯ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಅಥವಾ ಫ್ರೂಟ್ಸ್ ಪೋರ್ಟಲ್ (https://fruits.karnataka.gov.in/) ಗೆ ಭೇಟಿ ನೀಡಿ.",
            "ಕರ್ನಾಟಕ ಡಿಬಿಟಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೇರ ನಗದು ಜಮೆ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ."
        ]
    },
    {
        "id": "krishi_bhagya",
        "name_en": "Krishi Bhagya Scheme (Karnataka Rainwater Harvesting)",
        "name_kn": "ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ (ಕೃಷಿ ಹೊಂಡ & ನೀರು ಸಂರಕ್ಷಣೆ)",
        "department": "Department of Agriculture, Government of Karnataka",
        "provider": "Department of Agriculture, Govt of Karnataka",
        "category": "Irrigation",
        "category_kn": "ನೀರಾವರಿ & ಹೊಂಡ",
        "level": "State (Karnataka)",
        "level_kn": "ಕರ್ನಾಟಕ ರಾಜ್ಯ",
        "benefit": "Capital subsidy of 80% to 90% for farm pond (Krishi Honda) construction, polythene lining, diesel/solar pump sets, shade nets, and micro-irrigation installations in rainfed and drought-prone taluks.",
        "benefit_kn": "ಮಳೆ ಆಶ್ರಿತ ಕೃಷಿ ಪ್ರದೇಶಗಳಲ್ಲಿ ಕೃಷಿ ಹೊಂಡ ನಿರ್ಮಾಣ, ಪಾಲಿಥೀನ್ ಹೊದಿಕೆ, ಡೀಸೆಲ್/ಸೌರ ಪಂಪ್‌ಸೆಟ್ ಮತ್ತು ಹನಿ ನೀರಾವರಿ ಘಟಕಗಳಿಗೆ 80% ರಿಂದ 90% ರಷ್ಟು ಸಹಾಯಧನ.",
        "eligibility": "Farmers owning agricultural land in rainfed and dryland taluks of Karnataka. Priority given to small, marginal, and SC/ST farmers.",
        "eligibility_kn": "ಕರ್ನಾಟಕದ ಮಳೆಯಾಶ್ರಿತ ಮತ್ತು ಒಣಭೂಮಿ ತಾಲೂಕುಗಳಲ್ಲಿ ಜಮೀನು ಹೊಂದಿರುವ ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರು.",
        "documents": [
            "Bhoomi RTC / Pahani",
            "FRUITS Farmer ID (FID)",
            "Aadhaar Card",
            "Caste Certificate (for SC/ST enhanced subsidy)",
            "Bank Passbook"
        ],
        "documents_kn": [
            "ಭೂಮಿ ಪಹಣಿ (RTC)",
            "ಫ್ರೂಟ್ಸ್ ರೈತ ಐಡಿ (FRUITS FID)",
            "ಆಧಾರ್ ಕಾರ್ಡ್",
            "ಜಾತಿ ಪ್ರಮಾಣ ಪತ್ರ (ಪ.ಜಾ/ಪ.ಪಂ ರೈತರಿಗೆ ಹೆಚ್ಚುವರಿ ಸಬ್ಸಿಡಿಗಾಗಿ)",
            "ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್"
        ],
        "official_source": "https://raitamitra.karnataka.gov.in/",
        "application_url": "https://raitamitra.karnataka.gov.in/",
        "action_label_en": "Visit Karnataka Agriculture Portal",
        "action_label_kn": "ಕೃಷಿ ಇಲಾಖೆ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active (District Quota Dependent)",
        "applicable_crops": ["all"],
        "applicable_districts": ["Mandya", "Mysuru", "Kolar", "Tumakuru", "Belagavi", "Vijayapura", "Kalaburagi", "Ballari", "Chitradurga", "Davanagere", "Koppal", "Raichur", "Gadag", "Haveri", "Bagalkote"],
        "next_steps_en": [
            "Check current year district target quotas at your local Assistant Director of Agriculture (ADA) office.",
            "Submit an application with your RTC and FRUITS FID at the nearest Raitha Samparka Kendra (RSK).",
            "Obtain GPS site inspection and pre-approval before commencing farm pond earthwork excavation.",
            "Complete installation and submit geo-tagged photographs and invoices for DBT subsidy disbursement."
        ],
        "next_steps_kn": [
            "ನಿಮ್ಮ ತಾಲೂಕಿನ ಸಹಾಯಕ ಕೃಷಿ ನಿರ್ದೇಶಕರ (ADA) ಕಚೇರಿಯಲ್ಲಿ ಪ್ರಸಕ್ತ ಸಾಲಿನ ಗುರಿ ಕೋಟಾ ಪರಿಶೀಲಿಸಿ.",
            "ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಪಹಣಿ ಹಾಗೂ ಫ್ರೂಟ್ಸ್ ಐಡಿ ಸಮೇತ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            "ಕೃಷಿ ಹೊಂಡ ನಿರ್ಮಾಣಕ್ಕೆ ಕೃಷಿ ಇಲಾಖೆ ಅಧಿಕಾರಿಗಳಿಂದ ಸ್ಥಳ ಪರಿಶೀಲನೆ ಹಾಗೂ ಮುಂಚಿತ ಅನುಮೋದನೆ ಪಡೆಯಿರಿ.",
            "ಕಾಮಗಾರಿ ಪೂರ್ಣಗೊಳಿಸಿ ಜಿಯೋ-ಟ್ಯಾಗ್ ಫೋಟೋ ಹಾಗೂ ರಶೀದಿ ಸಲ್ಲಿಸಿ ಸಬ್ಸಿಡಿ ಮೊತ್ತ ಪಡೆಯಿರಿ."
        ]
    },
    {
        "id": "pmksy_micro_irrigation",
        "name_en": "PMKSY - Per Drop More Crop (Drip & Sprinkler Subsidy)",
        "name_kn": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಕೃಷಿ ಸಿಂಚಾಯಿ ಯೋಜನೆ (ಹನಿ & ತುಂತುರು ನೀರಾವರಿ)",
        "department": "Department of Horticulture & Agriculture, Govt of Karnataka",
        "provider": "Department of Agriculture / Horticulture, GoI & Govt of Karnataka",
        "category": "Irrigation",
        "category_kn": "ನೀರಾವರಿ & ಹೊಂಡ",
        "level": "Central & State Joint",
        "level_kn": "ಕೇಂದ್ರ & ರಾಜ್ಯ ಜಂಟಿ",
        "benefit": "Up to 90% financial subsidy for small and marginal farmers (45-50% for general farmers) to install micro-irrigation systems (drip and sprinkler) to conserve water, reduce electricity demand, and boost fertilizer-use efficiency.",
        "benefit_kn": "ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರಿಗೆ ಹನಿ ನೀರಾವರಿ ಹಾಗೂ ತುಂತುರು ನೀರಾವರಿ ಅಳವಡಿಕೆಗೆ 90% ವರೆಗೆ ಸಹಾಯಧನ (ಇತರ ರೈತರಿಗೆ 45-50% ಸಬ್ಸಿಡಿ).",
        "eligibility": "Farmers with valid agricultural landholding and an assured, functional water source (borewell, open well, or farm pond).",
        "eligibility_kn": "ಸಾಗುವಳಿ ಜಮೀನು ಹಾಗೂ ಕೊಳವೆಬಾವಿ, ಬಾವಿ ಅಥವಾ ಹೊಂಡದಂತಹ ನೀರಿನ ಮೂಲ ಹೊಂದಿರುವ ಎಲ್ಲಾ ರೈತರು.",
        "documents": [
            "Bhoomi RTC / Pahani",
            "Water Source Certificate / Borewell electricity bill",
            "FRUITS Farmer ID (FID)",
            "Aadhaar Card and Bank Details"
        ],
        "documents_kn": [
            "ಭೂಮಿ ಪಹಣಿ (RTC)",
            "ನೀರಿನ ಮೂಲ ದೃಢೀಕರಣ / ವಿದ್ಯುತ್ ಬಿಲ್ / ಕೊಳವೆಬಾವಿ ಪ್ರಮಾಣಪತ್ರ",
            "ಫ್ರೂಟ್ಸ್ ರೈತ ಐಡಿ (FRUITS FID)",
            "ಆಧಾರ್ ಕಾರ್ಡ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರ"
        ],
        "official_source": "https://raitamitra.karnataka.gov.in/",
        "application_url": "https://fruits.karnataka.gov.in/",
        "action_label_en": "Apply via FRUITS / Horticulture",
        "action_label_kn": "ಫ್ರೂಟ್ಸ್ / ತೋಟಗಾರಿಕೆ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Select an empaneled, ISI-certified micro-irrigation supplier in your taluk.",
            "Submit application online via FRUITS portal or visit local Horticulture/Agriculture office.",
            "Field officer conducts pre-inspection of water source and farm boundary layout.",
            "Receive work order, install the micro-irrigation system, and complete post-inspection verification."
        ],
        "next_steps_kn": [
            "ಕೃಷಿ/ತೋಟಗಾರಿಕೆ ಇಲಾಖೆ ಅನುಮೋದಿತ ಐಎಸ್‌ಐ ಪ್ರಮಾಣಿತ ಹನಿ ನೀರಾವರಿ ಕಂಪನಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            "ಫ್ರೂಟ್ಸ್ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅಥವಾ ತೋಟಗಾರಿಕೆ ಇಲಾಖಾ ಕಚೇರಿಯಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            "ಅಧಿಕಾರಿಗಳು ನೀರಿನ ಮೂಲ ಮತ್ತು ಹೊಲದ ಅಳತೆಯ ಸ್ಥಳ ಪರಿಶೀಲನೆ ನಡೆಸುತ್ತಾರೆ.",
            "ಕಾರ್ಯಾದೇಶ ಪಡೆದು ಯಂತ್ರೋಪಕರಣ ಅಳವಡಿಸಿದ ನಂತರ ತಪಾಸಣೆ ನಡೆಸಿ ಸಬ್ಸಿಡಿ ಹಣ ಪಡೆಯಿರಿ."
        ]
    },
    {
        "id": "fruits_karnataka",
        "name_en": "Karnataka FRUITS Portal (Farmer ID & Single-Window Registration)",
        "name_kn": "ಫ್ರೂಟ್ಸ್ ಪೋರ್ಟಲ್ (FRUITS - ರೈತ ಮಾಹಿತಿ ಮತ್ತು ನೋಂದಣಿ ಪೋರ್ಟಲ್)",
        "department": "Center for e-Governance & Department of Agriculture, Govt of Karnataka",
        "provider": "Government of Karnataka",
        "category": "Farmer Registration & ID",
        "category_kn": "ರೈತ ನೋಂದಣಿ & ಐಡಿ",
        "level": "State (Karnataka)",
        "level_kn": "ಕರ್ನಾಟಕ ರಾಜ್ಯ",
        "benefit": "Assigns a unique, permanent Farmer Identification Number (FID) unified with Bhoomi RTC land registry. Once enrolled, farmers automatically qualify for all state agricultural, horticultural, sericultural, and animal husbandry DBT subsidies and disaster compensations without repeated paper submissions.",
        "benefit_kn": "ಭೂಮಿ ಆರ್‌ಟಿಸಿ ಜೊತೆ ಸಂಯೋಜಿತವಾದ ಶಾಶ್ವತ ರೈತ ಗುರುತಿನ ಸಂಖ್ಯೆ (FID) ನೀಡಿಕೆ. ಒಮ್ಮೆ ನೋಂದಾಯಿಸಿಕೊಂಡರೆ ಕೃಷಿ, ತೋಟಗಾರಿಕೆ, ರೇಷ್ಮೆ ಮತ್ತು ಪಶುಸಂಗೋಪನೆ ಇಲಾಖೆಗಳ ಎಲ್ಲಾ ಸಬ್ಸಿಡಿಗಳು ನೇರವಾಗಿ ಲಭ್ಯ.",
        "eligibility": "All agricultural landowners and cultivators in Karnataka.",
        "eligibility_kn": "ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಕೃಷಿ ಭೂಹಿಡುವಳಿದಾರರು.",
        "documents": [
            "Aadhaar Card",
            "Bhoomi RTC / Pahani (Survey Number and Hissa Number)",
            "Bank Passbook (Aadhaar linked for DBT)",
            "Active Mobile Number"
        ],
        "documents_kn": [
            "ಆಧಾರ್ ಕಾರ್ಡ್",
            "ಭೂಮಿ ಪಹಣಿ (ಸರ್ವೆ ನಂಬರ್ ಮತ್ತು ಹಿಸ್ಸಾ ನಂಬರ್)",
            "ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ (ಆಧಾರ್ ಲಿಂಕ್ ಆಗಿರಬೇಕು)",
            "ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
        ],
        "official_source": "https://fruits.karnataka.gov.in/",
        "application_url": "https://fruits.karnataka.gov.in/",
        "action_label_en": "Open FRUITS Official Portal",
        "action_label_kn": "ಫ್ರೂಟ್ಸ್ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active (Mandatory for State Subsidies)",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Visit the official FRUITS portal (https://fruits.karnataka.gov.in/).",
            "Check if your Aadhaar is already registered to retrieve your 10-digit FID.",
            "If not registered, visit nearest Raitha Samparka Kendra, Grama One, or Karnataka One center.",
            "Link all land parcels and keep bank account updated to receive uninterrupted DBT transfers."
        ],
        "next_steps_kn": [
            "ಫ್ರೂಟ್ಸ್ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ (https://fruits.karnataka.gov.in/) ಗೆ ಭೇಟಿ ನೀಡಿ.",
            "ನಿಮ್ಮ ಆಧಾರ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ನಿಮ್ಮ 10 ಅಂಕಿಯ ಎಫ್‌ಐಡಿ (FID) ಪರಿಶೀಲಿಸಿ.",
            "ಹೊಸ ನೋಂದಣಿಗಾಗಿ ಸಮೀಪದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ, ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಕರ್ನಾಟಕ ಒನ್ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.",
            "ಎಲ್ಲಾ ಸರ್ವೆ ನಂಬರ್‌ಗಳನ್ನು ಜೋಡಿಸಿ ಬ್ಯಾಂಕ್ ಖಾತೆ ಚಾಲ್ತಿಯಲ್ಲಿಡಿ."
        ]
    },
    {
        "id": "samrakshane_karnataka",
        "name_en": "Karnataka Samrakshane Portal (State Crop Insurance System)",
        "name_kn": "ಕರ್ನಾಟಕ ಸಂರಕ್ಷಣೆ ಪೋರ್ಟಲ್ (ರಾಜ್ಯ ಬೆಳೆ ವಿಮೆ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ)",
        "department": "Department of Agriculture, Government of Karnataka",
        "provider": "Department of Agriculture, Govt of Karnataka",
        "category": "Crop Insurance",
        "category_kn": "ಬೆಳೆ ವಿಮೆ",
        "level": "State (Karnataka)",
        "level_kn": "ಕರ್ನಾಟಕ ರಾಜ್ಯ",
        "benefit": "Karnataka's specialized crop insurance management portal directly integrated with Bhoomi land records and KSNDMC weather telemetry. Farmers can check notified crops, verify insured acreage, calculate seasonal premium, view proposal status, and monitor claim settlement disbursements.",
        "benefit_kn": "ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಅಧಿಕೃತ ಬೆಳೆ ವಿಮೆ ಪೋರ್ಟಲ್. ಅಧಿಸೂಚಿತ ಬೆಳೆಗಳ ಪಟ್ಟಿ, ಪ್ರೀಮಿಯಂ ಲೆಕ್ಕಾಚಾರ, ಪ್ರಸ್ತಾವನೆ ಸ್ಥಿತಿ ಮತ್ತು ವಿಮಾ ಪರಿಹಾರ ಹಣ ಜಮೆ ವಿವರಗಳನ್ನು ನೇರವಾಗಿ ವೀಕ್ಷಿಸಬಹುದು.",
        "eligibility": "Karnataka farmers growing notified crops in notified insurance units for Kharif / Rabi seasons.",
        "eligibility_kn": "ಕರ್ನಾಟಕದ ಅಧಿಸೂಚಿತ ಬೆಳೆಗಳನ್ನು ಬೆಳೆಯುವ ಎಲ್ಲಾ ರೈತರು.",
        "documents": [
            "Bhoomi RTC / Pahani with Survey No",
            "FRUITS FID Number",
            "Bank Account linked to Aadhaar",
            "Insurance Proposal Number / Application Reference"
        ],
        "documents_kn": [
            "ಭೂಮಿ ಪಹಣಿ (RTC)",
            "ಫ್ರೂಟ್ಸ್ ರೈತ ಐಡಿ (FID)",
            "ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಖಾತೆ",
            "ವಿಮಾ ಪ್ರಸ್ತಾವನೆ ಸಂಖ್ಯೆ (Proposal Number)"
        ],
        "official_source": "https://samrakshane.karnataka.gov.in/",
        "application_url": "https://samrakshane.karnataka.gov.in/",
        "action_label_en": "Open Samrakshane Portal",
        "action_label_kn": "ಸಂರಕ್ಷಣೆ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ",
        "last_verified_date": "2026-10-24",
        "status": "Active (State PMFBY Gateway)",
        "applicable_crops": ["all"],
        "applicable_districts": ["all"],
        "next_steps_en": [
            "Open Samrakshane portal (https://samrakshane.karnataka.gov.in/).",
            "Select current financial year and season (Kharif / Rabi).",
            "Click 'Farmer Corner' to check your notified crop insurance status.",
            "Enter Application / Proposal number or mobile number to track claim disbursement."
        ],
        "next_steps_kn": [
            "ಸಂರಕ್ಷಣೆ ಪೋರ್ಟಲ್ (https://samrakshane.karnataka.gov.in/) ಗೆ ಭೇಟಿ ನೀಡಿ.",
            "ಪ್ರಸಕ್ತ ಸಾಲು ಮತ್ತು ಹಂಗಾಮನ್ನು (ಖಾರಿಫ್ / ರಬಿ) ಆಯ್ಕೆಮಾಡಿ.",
            "'Farmer Corner' ನಲ್ಲಿ ಅಧಿಸೂಚಿತ ಬೆಳೆ ಮತ್ತು ಪ್ರೀಮಿಯಂ ದರ ಪರಿಶೀಲಿಸಿ.",
            "ಅರ್ಜಿ ಸಂಖ್ಯೆ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ವಿಮಾ ಪರಿಹಾರದ ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ."
        ]
    }
]

CROP_INSURANCE_RESOURCES: Dict[str, Any] = {
    "title_en": "Crop Insurance (PMFBY & Samrakshane) Quick Access Hub",
    "title_kn": "ಬೆಳೆ ವಿಮೆ (ಪಿಎಂಎಫ್‌ಬಿವೈ & ಸಂರಕ್ಷಣೆ) ತ್ವರಿತ ಸೌಲಭ್ಯ ಕೇಂದ್ರ",
    "disclaimer": "MannuMitra provides scheme information and links to official services. Eligibility, benefits, application approval, insurance coverage and claim settlement are determined by the responsible government department, insurer or authorized institution.",
    "disclaimer_kn": "ಮಣ್ಣುಮಿತ್ರ ಕೃಷಿ ಯೋಜನೆಗಳ ಮಾಹಿತಿ ಮತ್ತು ಅಧಿಕೃತ ಸೇವೆಗಳ ಲಿಂಕ್‌ಗಳನ್ನು ಒದಗಿಸುತ್ತದೆ. ಅರ್ಹತೆ, ಸೌಲಭ್ಯಗಳು, ಅರ್ಜಿ ಅನುಮೋದನೆ, ವಿಮಾ ವ್ಯಾಪ್ತಿ ಮತ್ತು ಪರಿಹಾರ ಪಾವತಿಯನ್ನು ಸಂಬಂಧಪಟ್ಟ ಸರ್ಕಾರಿ ಇಲಾಖೆ ಅಥವಾ ಅಧಿಕೃತ ಸಂಸ್ಥೆಗಳು ನಿರ್ಧರಿಸುತ್ತವೆ.",
    "helpline": {
        "number": "14447",
        "name_en": "National Krishi Rakshak Helpline",
        "name_kn": "ರಾಷ್ಟ್ರೀಯ ಕೃಷಿ ರಕ್ಷಕ ಸಹಾಯವಾಣಿ (ಉಚಿತ ಕರೆ)",
        "note_en": "Toll-free 24x7 helpline for crop insurance claim tracking, grievance registration, and localized crop loss assistance.",
        "note_kn": "ಬೆಳೆ ವಿಮೆ ಪರಿಹಾರ, ದೂರು ನೋಂದಣಿ ಮತ್ತು ಬೆಳೆ ನಷ್ಟ ಸಹಾಯಕ್ಕಾಗಿ 24x7 ಉಚಿತ ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿ."
    },
    "key_guidelines": [
        {
            "point_en": "Notified Crops & Areas: Insurance is strictly applicable only to notified crops in designated hoblis/panchayats for the specific Kharif or Rabi season.",
            "point_kn": "ಅಧಿಸೂಚಿತ ಬೆಳೆಗಳು & ಪ್ರದೇಶಗಳು: ವಿಮೆಯು ಪ್ರಸಕ್ತ ಹಂಗಾಮಿನಲ್ಲಿ ಸರ್ಕಾರ ಅಧಿಸೂಚಿಸಿದ ನಿರ್ದಿಷ್ಟ ಬೆಳೆ ಮತ್ತು ತಾಲೂಕು/ಹೋಬಳಿಗಳಿಗೆ ಮಾತ್ರ ಅನ್ವಯಿಸುತ್ತದೆ."
        },
        {
            "point_en": "Seasonal Cut-Off Deadlines: Enrollment cut-offs (typically July 31 for Kharif and November 30 / December 31 for Rabi) are strictly enforced by the government. Late applications cannot be processed.",
            "point_kn": "ಹಂಗಾಮಿನ ಅಂತಿಮ ದಿನಾಂಕ: ಖಾರಿಫ್ (ಜುಲೈ 31) ಮತ್ತು ರಬಿ ಬೆಳೆಗಳಿಗೆ ಸರ್ಕಾರ ನಿಗದಿಪಡಿಸುವ ಕೊನೆಯ ದಿನಾಂಕದೊಳಗೆ ನೋಂದಾಯಿಸಿಕೊಳ್ಳುವುದು ಕಡ್ಡಾಯ."
        },
        {
            "point_en": "Premium Rates: Farmers pay only 2% of sum insured for Kharif food/oilseeds, 1.5% for Rabi food/oilseeds, and 5% for annual commercial/horticultural crops. The remainder is fully subsidized by the Government.",
            "point_kn": "ಕಡಿಮೆ ಪ್ರೀಮಿಯಂ ದರ: ರೈತರು ಖಾರಿಫ್ ಬೆಳೆಗೆ ಕೇವಲ 2%, ರಬಿ ಬೆಳೆಗೆ 1.5% ಮತ್ತು ವಾಣಿಜ್ಯ/ತೋಟಗಾರಿಕೆ ಬೆಳೆಗಳಿಗೆ 5% ಪ್ರೀಮಿಯಂ ಪಾವತಿಸಬೇಕು."
        },
        {
            "point_en": "Insurance vs Credit / Relief: Crop insurance (PMFBY) is risk indemnity coverage and is completely distinct from crop loans (KCC), general subsidies, or SDRF/NDRF disaster relief grants.",
            "point_kn": "ವಿಮೆ ಮತ್ತು ಸಾಲದ ವ್ಯತ್ಯಾಸ: ಬೆಳೆ ವಿಮೆ (PMFBY) ನೈಸರ್ಗಿಕ ನಷ್ಟಕ್ಕೆ ಸಿಗುವ ವಿಮಾ ರಕ್ಷಣೆಯಾಗಿದ್ದು, ಇದು ಬೆಳೆ ಸಾಲ (KCC) ಅಥವಾ ಪ್ರಕೃತಿ ವಿಕೋಪ ಪರಿಹಾರಕ್ಕಿಂತ ಭಿನ್ನವಾಗಿದೆ."
        },
        {
            "point_en": "Localized Crop Loss Reporting: In the event of hailstorm, landslide, inundation, or post-harvest cyclonic damage, loss must be reported within 72 hours via the Crop Insurance App or helpline 14447.",
            "point_kn": "ಸ್ಥಳೀಯ ಬೆಳೆ ನಷ್ಟ ವರದಿ: ಆಲಿಕಲ್ಲು ಮಳೆ, ಪ್ರವಾಹ ಅಥವಾ ಚಂಡಮಾರುತದಿಂದ ಬೆಳೆ ಹಾನಿಯಾದಲ್ಲಿ 72 ಗಂಟೆಗಳ ಒಳಗೆ ಕ್ರಾಪ್ ಇನ್ಶುರೆನ್ಸ್ ಆ್ಯಪ್ ಅಥವಾ 14447 ಸಹಾಯವಾಣಿ ಮೂಲಕ ವರದಿ ಮಾಡಬೇಕು."
        }
    ],
    "action_links": [
        {
            "id": "pmfby_apply",
            "title_en": "Apply on PMFBY Portal",
            "title_kn": "ಪಿಎಂಎಫ್‌ಬಿವೈ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
            "url": "https://pmfby.gov.in/",
            "type": "official_application",
            "badge": "Official National Portal"
        },
        {
            "id": "pmfby_calculator",
            "title_en": "Calculate Crop Premium",
            "title_kn": "ವಿಮಾ ಪ್ರೀಮಿಯಂ ಲೆಕ್ಕ ಹಾಕಿ",
            "url": "https://pmfby.gov.in/premiumCalculator",
            "type": "official_calculator",
            "badge": "Official Calculator"
        },
        {
            "id": "pmfby_status",
            "title_en": "Check Application Status",
            "title_kn": "ಅರ್ಜಿ & ಪರಿಹಾರ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ",
            "url": "https://pmfby.gov.in/applicationStatus",
            "type": "official_status",
            "badge": "Official Status Tracker"
        },
        {
            "id": "samrakshane_portal",
            "title_en": "Karnataka Samrakshane Portal",
            "title_kn": "ಕರ್ನಾಟಕ ಸಂರಕ್ಷಣೆ ಪೋರ್ಟಲ್",
            "url": "https://samrakshane.karnataka.gov.in/",
            "type": "state_portal",
            "badge": "Karnataka State Portal"
        }
    ]
}


class FarmerSchemeService:
    @staticmethod
    def get_all_schemes() -> List[Dict[str, Any]]:
        return GOVERNMENT_SCHEMES

    @staticmethod
    def get_insurance_resources() -> Dict[str, Any]:
        return CROP_INSURANCE_RESOURCES

    @staticmethod
    def find_relevant_schemes(
        crop: Optional[str] = None,
        is_irrigated: Optional[bool] = None,
        category: Optional[str] = None,
        level: Optional[str] = None,
        district: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = []
        c_clean = crop.lower().strip() if crop else None
        cat_clean = category.lower().strip() if category else None
        lvl_clean = level.lower().strip() if level else None
        search_clean = search.lower().strip() if search else None
        dist_clean = district.lower().strip() if district else None

        for s in GOVERNMENT_SCHEMES:
            # Category filter
            if cat_clean and cat_clean not in {"all", ""}:
                if cat_clean not in s["category"].lower() and cat_clean not in s.get("category_kn", "").lower():
                    continue

            # Level filter (Central vs State)
            if lvl_clean and lvl_clean not in {"all", ""}:
                if lvl_clean == "central" and "central" not in s["level"].lower():
                    continue
                elif lvl_clean == "state" and "state" not in s["level"].lower() and "karnataka" not in s["level"].lower():
                    continue

            # Crop filter
            if c_clean:
                if "all" not in s["applicable_crops"] and c_clean not in [x.lower() for x in s["applicable_crops"]]:
                    # Specific crop handling (e.g. millet for raitha siri)
                    if s["id"] == "raitha_siri" and c_clean not in {"ragi", "bajra", "jowar", "millet"}:
                        continue
                    elif s["id"] not in {"pm_kisan", "soil_health_card", "jansamarth", "kisan_credit_card", "enam", "fruits_karnataka"}:
                        continue

            # District filter
            if dist_clean:
                if "all" not in s["applicable_districts"] and dist_clean not in [x.lower() for x in s["applicable_districts"]]:
                    continue

            # Search text query
            if search_clean:
                text_to_search = (
                    s["name_en"] + " " +
                    s["name_kn"] + " " +
                    s["category"] + " " +
                    s["benefit"] + " " +
                    s["eligibility"] + " " +
                    s["provider"]
                ).lower()
                if search_clean not in text_to_search:
                    continue

            results.append(s)

        return results if results else GOVERNMENT_SCHEMES
