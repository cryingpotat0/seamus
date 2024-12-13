# Seamus
Seamus (like CeeEmUss) is a CMS for my blog built on top of Convex. The goal of Seamus is to provide the best possible rich text editing experience that translates to my simple Astro blog. The Lexical playground is the closest to perfect rich text editing experience I found, so most of this project is integrating that with a general schema definition toolkit and the Convex APIs.


### TODOs
1. First goal is to get this integrated e2e with the blog. This involves a few things to add:

- :check: Improve the way that editorState for rich text is persisted
  :check:   - Ideally this will - on save - send a "request" to all the rich text entries to get their JSON. Then use this to save.
- :check: Ability to delete post
- :check: Proper date picker
- :check: Test integration with Astro blog
- Jupyter Renderer integration
- Cannon integration
- Add support for tags from a fixed list defined 
- Add media integration
- Add support for imagepicker with media uploads to convex
- Clean up UI
    - Improve margin on top
    - Make edit a modal that pops up
    - Make UI inline in some cases
- Move everything from blog.cryingpotato.com
    - Move existing MD articles from my current payload CMS instance (also uses Lexical, so should be easy).
    - Move MDX articles
    - Move logs
    - Move showcase
    - Move ideas

2. Now can come other things like:
- Pagination
- Live preview
- Autosave
- Add validation to schemas with validation funcs
- Add relationships and create a tags table as another collection
- Improve convex types for CRUD ops
- Add defaults for things like dates

3. Make it general
- Allow to connect to a random github etc.
- Collab editing

