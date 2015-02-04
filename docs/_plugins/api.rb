require 'redcarpet';
require 'pygments';

module Jekyll
  class ApiTag < Liquid::Block
    @@renderer = Class.new(Redcarpet::Render::HTML) do
      def add_code_tags(code, lang)
        code = code.sub(/<pre>/, "<pre><code class=\"#{lang} language-#{lang}\" data-lang=\"#{lang}\">")
        code = code.sub(/<\/pre>/,"</code></pre>")
      end

      def block_code(code, lang)
        require 'pygments'
        lang = lang && lang.split.first || "text"
        output = add_code_tags(Pygments.highlight(code, :lexer => lang, :options => { :encoding => 'utf-8' }),
                               lang) + "\n"
      end
    end

    def render(context)
      content = @nodelist.map { |token|
        token.respond_to?(:render) ? token.render(context) : token
      }.join.strip!

      content = content.split(/\n/)
      name = content[0]
      sig = content[1]
      desc = content[2..-1].join("\n")
      desc = Redcarpet::Markdown.new(@@renderer.new,
                                     fenced_code_blocks: true).render(desc)

      '### ' + name + "\n\n<div class=\"api-sig\"><code>" + sig + "</code></div>\n" +
        "<div class=\"api-desc\">" + desc + "</div>\n"
    end
  end
end

Liquid::Template.register_tag('api', Jekyll::ApiTag)
