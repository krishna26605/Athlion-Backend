self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/auth/:path*",
        "destination": "/api/auth/:path*"
      },
      {
        "source": "/events/:path*",
        "destination": "/api/events/:path*"
      },
      {
        "source": "/registrations/:path*",
        "destination": "/api/registrations/:path*"
      },
      {
        "source": "/admin/:path*",
        "destination": "/api/admin/:path*"
      },
      {
        "source": "/sponsors/:path*",
        "destination": "/api/sponsors/:path*"
      },
      {
        "source": "/checkin/:path*",
        "destination": "/api/checkin/:path*"
      },
      {
        "source": "/ai/:path*",
        "destination": "/api/ai/:path*"
      },
      {
        "source": "/analytics/:path*",
        "destination": "/api/analytics/:path*"
      },
      {
        "source": "/early-access/:path*",
        "destination": "/api/early-access/:path*"
      },
      {
        "source": "/blogs/:path*",
        "destination": "/api/blogs/:path*"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()