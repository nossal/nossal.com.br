# encoding: utf-8
#!/usr/bin/env python

from google.appengine.api import memcache
from google.appengine.ext import db
import webapp2 as webapp
import urllib2, base64, json
import jinja2
import os
import short

JINJA_ENVIRONMENT = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates/')))

def template(template_name):
	return JINJA_ENVIRONMENT.get_template(template_name +'.html')


class OauthCredentials(db.Model):
	service = db.StringProperty()
	client_key = db.StringProperty()
	secret = db.StringProperty()


class MainHandler(webapp.RequestHandler):
    def get(self):
		headers = self.request.headers
		#print headers['Accept-Language']
		self.response.out.write(template('index').render({'lang': headers['Accept-Language']}))


class StaticHandler(webapp.RequestHandler):
	def get(self, file):
		headers = self.request.headers
		print headers['Accept-Language']
		
		try:
			tpl = template(file)
		except:
			url = short.get_url(file, self.request)
			if url is not None:
				self.redirect(url)
				return
			else:
				self.error(404)
				tpl = template('not_found')

		self.response.out.write(tpl.render({'page': file, 'lang': headers['Accept-Language']}))

class LastTweet(webapp.RequestHandler):
	def get(self):
		callback_name = self.request.get("callback")

		tweet_json = '%s({\'error\': \'error\'})' % (callback_name)
		
		tweet = memcache.get('cache:tweet')

		if tweet is None:
			tweet = self.get_tweet()
			if tweet is not None:
				memcache.add('cache:tweet', tweet, 60*60*12)

		tweet['entities']['urls']
		if tweet is not None:
			tweet_json = '%s({\'text\': \'%s\', \'client\': \'%s\', \'created_at\': \'%s\', \'urls\': %s})' % (callback_name, tweet['text'], tweet['source'], tweet['created_at'], '[\'urls\']')

		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write(tweet_json)

		
	def get_tweet(self):
		token_url = 'https://api.twitter.com/oauth2/token'
		last_twitts = 'https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=nossal&count=10'
		
		q = db.GqlQuery("SELECT * FROM OauthCredentials WHERE service = :1", 'twitter')
		if q.count() > 0:
			results = q.fetch(1)
			p = results[0]
		else:
			return None

		credentials = base64.encodestring('%s:%s' % (p.client_key, p.secret)).replace('\n', '')
	
		request = urllib2.Request(token_url, 'grant_type=client_credentials')
		request.add_header('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
		request.add_header("Authorization", "Basic %s" % credentials)
		opener = urllib2.build_opener()
		data = opener.open(request).read()
		opener.close()


		token = json.loads(data)
	
		request = urllib2.Request(last_twitts)
		request.add_header("Authorization", "Bearer %s" % token['access_token'])
		opener = urllib2.build_opener()
		data = opener.open(request).read()
		opener.close()
	
		tweets = json.loads(data)
		
		return tweets[0]


class MyUrls(webapp.RequestHandler):
	def get(self):
		self.response.out.write(template('url').render())


class UrlShort(webapp.RequestHandler):
	def get(self, url):
		callback_name = self.request.get("callback")
		
		if not callback_name:
			self.error(400)
			#self.response.out.write(template('not_found').render({'page': url}))
			return


		code = short.set_url(url, self.request)

		domain = 'noss.al'
		response = '%s({url: \'http://%s/%s\'})' % (callback_name, domain, code)

		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write(response)


app = webapp.WSGIApplication([
	('/myurls', MyUrls),
	('/api/url/(.+)', UrlShort),
	('/api/mylasttweet', LastTweet),
	('/', MainHandler),
	('/(.+)', StaticHandler)
], debug=True)
