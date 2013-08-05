# encoding: utf-8
#!/usr/bin/env python

import webapp2 as webapp
import jinja2
import os

JINJA_ENVIRONMENT = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates/')))

def template(template_name):
	return JINJA_ENVIRONMENT.get_template(template_name +'.html')


class Webmaster(webapp.RequestHandler):
	def get(self):
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.out.write('google-site-verification: googlee57c607d6769319e.html')


class MainHandler(webapp.RequestHandler):
    def get(self):
		headers = self.request.headers
		print headers['Accept-Language']
		self.response.out.write(template('index').render({'lang': headers['Accept-Language']}))


class StaticHandler(webapp.RequestHandler):
	def get(self, file):
		
		headers = self.request.headers
		print headers['Accept-Language']
		
		try:
			tpl = template(file)
		except:
			self.error(404)
			tpl = template('not_found')

		self.response.out.write(tpl.render({'page': file, 'lang': headers['Accept-Language']}))
	
app = webapp.WSGIApplication([
    ('/', MainHandler),
	('/(.+)', StaticHandler),
	('/googlee57c607d6769319e.html', Webmaster)
], debug=True)
