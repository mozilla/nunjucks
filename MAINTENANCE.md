
# Pushing a New Version

Nunjucks attempts to adhere to semantic versioning. The API is very stable, so from here on out it will most likely be point releases.

1. Do a `pull` from github to make sure you have all the latest updates

2. View all the changes and update CHANGELOG.md:

```
$ git log --oneline v1.2.3..master
```

Replace `v1.2.3` with whatever the last version was, and you'll see all the changes going out in this version. Add a new version to CHANGELOG.md and write some notes about what's going out.

3. Update the version in `package.json`

4. Run the command to make sure the ready-made files for the browser are up-to-date.

```
$ make browserfiles
```

5. Commit above changes and push to `master`

6. Publish to npm:

```
npm publish
```

7. Go to https://github.com/mozilla/nunjucks/releases and click "Draft a new release". Fill out title and copy what you entered in CHANGELOG.md in the description. (CHANGELOG.md could go away I guess with github's release stuff)

8. Make sure docs are up-to-date. If anything, you need to copy all the nunjucks*.js files in `browser/` to the [nunjucks-docs repo](https://github.com/mozilla/nunjucks-docs) in the `files` directory. This is where the "download" link points to in the docs. In `nunjucks-docs`, build the docs:

```
cd path/to/nunjucks-docs && make prod
```

And push (force push if necessary) the build out _site folder onto the `gh-pages` branch of the `nunjucks` repo to get it live.
