
all:
	LC_ALL="UTF-8" jekyll serve --watch

prod:
	cp ../browser/* files
	rsync -avz ../tests/ files/tests
	LC_ALL="UTF-8" jekyll build --config _config.yml,_config-prod.yml
