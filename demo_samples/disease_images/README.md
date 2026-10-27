# Scientific Demonstration Leaf Samples (10 Images Across 5 Crops)

This folder contains 10 verified scientific demonstration leaf images across the 5 crops supported by MannuMitra's MobileNetV2 disease classification models.

These samples are provided for testing, demonstration, and manual selection using the **Browse File** button on the Disease Detection page.

## Directory Structure

`
demo_samples/disease_images/
├── arecanut/
│   ├── arecanut_healthy.jpg                 <- Healthy Arecanut Palm Frond
│   └── arecanut_koleroga_fruit_rot.jpg       <- Koleroga / Mahali (Fruit Rot)
├── cotton/
│   ├── cotton_bacterial_blight.jpg          <- Angular Leaf Spot / Bacterial Blight
│   └── cotton_healthy.jpg                   <- Healthy Cotton Leaf
├── maize/
│   ├── maize_common_rust.jpg                <- Common Rust (Puccinia sorghi)
│   └── maize_healthy.jpg                    <- Healthy Green Maize Leaf
├── rice/
│   ├── rice_bacterial_leaf_blight.jpg       <- Bacterial Leaf Blight (Xanthomonas oryzae)
│   └── rice_brown_spot.jpg                  <- Brown Spot (Bipolaris oryzae)
└── tomato/
    ├── tomato_early_blight.jpg              <- Early Blight (Alternaria solani)
    └── tomato_healthy.jpg                   <- Healthy Tomato Leaf
`

All 10 samples are also available in this folder root with descriptive names:
1. recanut_healthy.jpg (or recanut_disease_demo_01.jpg)
2. recanut_koleroga_fruit_rot.jpg (or recanut_disease_demo_02.jpg)
3. cotton_bacterial_blight.jpg (or cotton_disease_demo_01.jpg)
4. cotton_healthy.jpg (or cotton_disease_demo_02.jpg)
5. maize_common_rust.jpg (or maize_disease_demo_01.jpg)
6. maize_healthy.jpg (or maize_disease_demo_02.jpg)
7. 
ice_brown_spot.jpg (or 
ice_disease_demo_01.jpg)
8. 
ice_bacterial_leaf_blight.jpg (or 
ice_disease_demo_02.jpg)
9. 	omato_early_blight.jpg (or 	omato_disease_demo_01.jpg)
10. 	omato_healthy.jpg (or 	omato_disease_demo_02.jpg)

## How to Test in the Application
1. On the **Disease Detection** page, select the matching crop tab (e.g. *Arecanut*, *Maize*, *Tomato*, *Rice*, or *Cotton*).
2. Click **📁 Browse File (ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ)** to open your system file picker.
3. Navigate to this folder (demo_samples/disease_images/) and pick any leaf photograph.
4. Click **🔬 Detect Plant Disease (ರೋಗ ಪತ್ತೆ ಹಚ್ಚಿ)** to execute live inference through the MobileNetV2 model.
