# Project Backlog

## Resume Certifications Gallery
- [x] Replace random image placement with a more organized layout.
- [x] Reorganize images on window resize to ensure they stay within the visible screen area.
- [x] Render images progressively as they load instead of waiting for all to complete.
- [x] Create an image queue loader: fetch images, add to queue, and process queue every 250ms to float images in one by one.
- [x] Ensure initial image placement keeps (x + width) and (y + height) within screen bounds.
- [x] Animate images floating into position from a nearby border upon loading.
- [x] Ensure focused image is perfectly centered in the screen.
- [x] Dynamically adjust default image height based on window width for better mobile/small screen display.
- [x] Dynamically adjust default image height based on window height for better mobile/small screen display. Consider for <iframe>
- [x] Create a grid layout with a small overlap where the starting image starts in the center. this needs a little more definition.
- [x] the radial layout seems to load more images on the righ of the page. Also there is a lot of overlap. Also some images are partially off the screen on the left.
- [x] Tweak scaling and position on different window sizes
- [x] Change page title to "Resume Certifications Gallery"
- [ ] Radial layout has some extra border on the edges that we could take out.
- [x] Move google drive API key out of config.js and into a parameter passed the outermost method.
- [ ] Fix "Loading images..." text still visible after gallery loads (fbn-ic-hidden class not hiding element properly)
- [x] in smaller context windows we need more discrete control over the size of the image and the "full view" size.
- [ ] Discuss custom fly-in animations - allow configurable entrance animation styles for images.
- [ ] Fix: Dragging window between screens triggers re-animation even when staying within same breakpoint.
- [ ] Fix: Duplicate images still appearing when resizing window from desktop to mobile size (race condition not fully resolved).
- [ ] Add ability to fully style images (border, border-color, shadow, border-radius, etc.) through config options or stylesheet.
- [ ] Support multiple loaders - allow a list of loaders in addition to one loader (e.g., combine Google Drive and static sources).
