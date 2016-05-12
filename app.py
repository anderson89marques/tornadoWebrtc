#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
from domain.models import engine
from sqlalchemy.orm import scoped_session, sessionmaker
from tornado.ioloop import IOLoop
from tornado.options import define, options
from controller.views import EchoWebSocket, MainHandler, GetUserLogged, LoginHandler, LogoutHandler
import tornado
from conf import ip

rel = lambda *x: os.path.abspath(os.path.join(os.path.dirname(__file__), *x))


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [(r'/login/(.*)', LoginHandler), (r'/live/(.*)', MainHandler), (r'/get-corrent-user', GetUserLogged),
                    (r'/ws/(.*)', EchoWebSocket), (r'/logout', LogoutHandler),]

        settings = dict(static_path=rel('static'),
                        template_path=rel('templates'),
                        debug=True, cookie_secret="key:ab1b90A")

        tornado.web.Application.__init__(self, handlers, **settings)
        self.db = scoped_session(sessionmaker(bind=engine))


def main():
    print("Inicializando aplicação...")
    define('listen', metavar='IP', default=ip, help='listen on IP address (default 127.0.0.1)')
    define('port', metavar='PORT', default=6544, type=int, help='listen on PORT (default 6544)')
    define('debug', metavar='True|False', default=False, type=bool, 
        help='enable Tornado debug mode: templates will not be cached '
        'and the app will watch for changes to its source files '
        'and reload itself when anything changes')
    
    options.parse_command_line()

    
    Application().listen(address=options.listen, port=options.port)
    IOLoop.instance().start()


if __name__ == '__main__':
    main()
