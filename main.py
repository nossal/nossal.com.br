# encoding: utf-8
#!/usr/bin/env python

from google.appengine.api import memcache
from google.appengine.api import mail
from google.appengine.ext import db

import webapp2 as webapp
import urllib2, urllib, base64, json
import jinja2
import os
import re
import short

JINJA_ENVIRONMENT = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates/')))

def template(template_name):
	return JINJA_ENVIRONMENT.get_template(template_name +'.html')


def is_valid(email):
	if len(email) > 7:
		if re.match("^.+\\@(\\[?)[a-zA-Z0-9\\-\\.]+\\.([a-zA-Z]{2,3}|[0-9]{1,3})(\\]?)$", email) != None:
			return True
	return False


def send_email(from_addr, message_str):
	message = mail.EmailMessage(sender="Rodrigo Nossal <nossal@gmail.com>", subject="[noss.al] Contato")
	message.to = "Rodrigo Nossal <nossal@gmail.com>"
	message.body = u"From: <%s>\n\n%s" % (from_addr, message_str)

	message.send()


class OauthCredentials(db.Model):
	service = db.StringProperty()
	client_key = db.StringProperty()
	secret = db.StringProperty()

#twtr = OauthCredentials(service="twitter", client_key="BVTiUUJ9kTcHHAlXdm2zdg", secret="GebLdWyfPZFlHubBqLKO6CALVQkgMb8jVmYTO2fDYg")
#twtr.put()
#fcb = OauthCredentials(service="facebook", client_key="120018904767114", secret="34cc327b5cee87f56929ffc3c1f4479f")
#fcb.put()

class MainHandler(webapp.RequestHandler):
	def get(self):
		headers = self.request.headers
		#print headers['Accept-Language']
		self.response.out.write(template('index').render())
		
		
	def post(self):
		email = self.request.get('email')
		email = email.strip()
		
		message = self.request.get('message')
		
		if is_valid(email):
			send_email(email, message)
			
		self.response.out.write(template('index').render())


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


class FBLikes(webapp.RequestHandler):
	def get(self):
		callback_name = self.request.get("callback")

		likes_json = '%s({\'error\': \'error\'})' % (callback_name)
		
		likes = memcache.get('cache:likes')

		if likes is None:
			likes = self.get_likes()
			if likes is not None:
				memcache.add('cache:likes', likes, 60*60*24*30)

		if likes is not None:
			likes_json = "%s(%s)" % (callback_name, likes)

		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write(likes_json)


	def get_likes(self):
		q = db.GqlQuery("SELECT * FROM OauthCredentials WHERE service = :1", 'facebook')
		if q.count() > 0:
			results = q.fetch(1)
			p = results[0]
		else:
			return None
		
		d = {'client': p.client_key, 'secret': p.secret}
		url = 'https://graph.facebook.com/v2.1/649914250/likes?access_token=%(client)s|%(secret)s&limit=100' % d
		
		request = urllib2.Request(url)
		opener = urllib2.build_opener()
		data = opener.open(request).read()
		opener.close()
	
		return  data



class LastTweet(webapp.RequestHandler):
	def get(self):
		callback_name = self.request.get("callback")

		tweet_json = '%s({\'error\': \'error\'})' % (callback_name)
		
		tweets = memcache.get('cache:tweets')

		if tweets is None:
			tweets = self.get_tweet()
			if tweets is not None:
				memcache.add('cache:tweets', tweets, 60*60*60)

		if tweets is not None:
			tweet_json = "%s(%s)" % (callback_name, tweets)

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
	
		return data


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
	('/api/myfblikes', FBLikes),
	('/', MainHandler),
	('/(.+)', StaticHandler)
], debug=True)
