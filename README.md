# Seamus
Seamus (like CeeEmUss) is a CMS for my blog built on top of Convex. The goal of Seamus is to provide the best possible rich text editing experience that translates to my simple Astro blog. The Lexical playground is the closest to perfect rich text editing experience I found, so most of this project is integrating that with a general schema definition toolkit and the Convex APIs.


### TODOs
1. First goal is to get this integrated e2e with the blog. This involves a few things to add:

- :check: Improve the way that editorState for rich text is persisted
  :check:   - Ideally this will - on save - send a "request" to all the rich text entries to get their JSON. Then use this to save.
- :check: Ability to delete post
- :check: Proper date picker
- :check: Test integration with Astro blog
- :check: Jupyter Renderer integration
    - The serialized contents should just be the data at the cell
- Cannon integration
- Add support for tags from a fixed list defined --- just did a stringarray
- Add media integration
    - :check: Add display of media content
    - :check: Don't reupload media content if it hasn't changed
    - :check: Change semantics of default media to default rich text media
    - :check: Test hero image for media on a regular collection
    - :check: Rich text media works
- :check: Add support for imagepicker with media uploads to convex
    - Bug: image doesn't load until you refresh the cms page entirely - suspect something to do with using the convexhttpclient
- Move everything from blog.cryingpotato.com
    - Move existing MD articles from my current payload CMS instance (also uses Lexical, so should be easy).
    - Move MDX articles
    - :check: Move logs
    - :check: Move showcase
    - Move ideas
- Clean up UI
    - Improve margin on top
    - Make edit a modal that pops up
    - Make UI inline in some cases
- Loading states on save

2. Now can come other things like:
- Autodeploy URL
- Pagination
- Live preview
- Autosave
- Delete media on delete of row
- Add validation to schemas with validation funcs
- Add relationships and create a tags table as another collection
- Improve convex types for CRUD ops
- Add defaults for things like dates
- Embeds should be able to take multiple args
    - Have a direct definition to an action
    - Allow a cors proxy through convex for weird logic for the embedding
    - Allow editing embeds post facto
    - Allow resizing Embeds
- media
    - Automatically have different processing based on type of media - e.g. different image sizes
- datefields
    - Automatically support created at/ updated at
- hydrate media to some static image provider like cloudflare rather than just using the raw convex values
- migrationview should allow error values

3. Make it general
- Allow to connect to a random github etc.
- Collab editing

