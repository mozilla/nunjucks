require 'redcarpet';

module Jekyll
  class PageTocTag < Liquid::Tag
    def initialize(tag_name, args, tokens)
    end
    def render(context)
      content = File.open(context.environments.first["page"]["path"]).read
      content = content.gsub(/^---.*\n---/m, '')
      content = content.gsub(/^{% api %}\n([^\n]*)/m, '### \1')
      names = {}

      content = Redcarpet::Markdown.new(Redcarpet::Render::HTML_TOC).render(content)
      content.gsub(/toc_\d*">([^<]*)/) {
        name = $1
        slug = name.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')

        if names.has_key?(slug)
          i = 1
          newSlug = slug + i.to_s
          while names.has_key?(newSlug)
            i = i + 1
            newSlug = slug + i.to_s
          end
          slug = newSlug
        end

        names[slug] = true
        slug + '">' + name
      }
    end
  end

end

Liquid::Template.register_tag('page_toc', Jekyll::PageTocTag)
