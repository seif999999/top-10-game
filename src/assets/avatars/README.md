# Avatar Assets

This directory contains the avatar image assets for the avatar system.

## Required Assets

The following avatar images are required for the avatar system to function:

### Human Avatars
- `human-1.png` - Person 1 avatar
- `human-2.png` - Person 2 avatar

### Animal Avatars  
- `animal-1.png` - Cat avatar
- `animal-2.png` - Dog avatar
- `animal-3.png` - Owl avatar

## Asset Specifications

- **Format**: PNG with transparency
- **Size**: 128x128 pixels (will be scaled down for display)
- **Style**: Sporcle-inspired simple, clean icons
- **Background**: Transparent
- **Shape**: Circular design (content should fit within a circle)

## Implementation Notes

- Assets are referenced in `src/utils/avatarConstants.ts`
- Images are loaded dynamically based on user selection
- Fallback to first letter of name when no avatar is selected
- All avatars should be optimized for performance

## Adding New Avatars

To add new avatars:
1. Add the image file to this directory
2. Update the `AVAILABLE_AVATARS` array in `src/utils/avatarConstants.ts`
3. Follow the naming convention: `{category}-{number}.png`
4. Ensure the image meets the specifications above
