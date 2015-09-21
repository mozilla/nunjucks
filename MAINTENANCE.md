
# Pushing a New Version

Nunjucks attempts to adhere to semantic versioning. The API is very stable, so
from here on out it will most likely be point releases.

1. Do a `pull` from github to make sure you have all the latest updates.

2. View all the changes since the last version:

   ```
   $ git log --oneline v1.2.3..master
   ```

Replace `v1.2.3` with whatever the last version was, and you'll see all the
changes going out in this version. Ensure that all significant user-facing
changes (new features and bugfixes) are mentioned in `CHANGELOG.md`. Change the
"master (unreleased)" heading in `CHANGELOG.md` to the new version number and
date.

3. Update the version in `package.json`.

3. Run the command to update the ready-made files for the browser.

   ```
   $ npm run browserfiles
   ```

5. Commit above changes and push to `master`.

6. Draft a new release on GitHub and copy the changelog to the description. The
   title should be the version.

7. Publish to npm:

   ```
   npm publish
   ```

8. Make sure docs are up-to-date. You need to copy all the `nunjucks*.js` files
   in `browser/` to the docs. This is where the "download" link points to in
   the docs. Push (force push if necessary) the build out _site folder onto the
   `gh-pages` branch of the `nunjucks` repo to get it live.

   ```
   cp browser/* docs/files
   cd docs && make prod
   cd _site && git push origin gh-pages
   ```

   The last step assumes you have setup a git repo in _site pointing to
   nunjucks' gh-pages branch.

9. Add a new "master (unreleased)" section at the top of `CHANGELOG.md`.

10. Bump the version number in `package.json` to a development pre-release of
    the next anticipated release number (e.g. "2.2.0-dev.1").
