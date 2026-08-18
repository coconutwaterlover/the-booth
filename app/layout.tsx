import type { ReactNode } from 'react'
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: "The Booth",
  description: "Live quotes, flow, and open positions — American football, from the truck.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PostHog — Studio's project, identical across every venue. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(\".\");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement(\"script\")).type=\"text/javascript\",p.async=!0,p.src=s.api_host+\"/static/array.js\",(r=t.getElementsByTagName(\"script\")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a=\"posthog\",u.people=u.people||[],u.toString=function(t){var e=\"posthog\";return\"posthog\"!==a&&(e+=\".\"+a),t||(e+=\" (stub)\"),e},u.people.toString=function(){return u.toString(1)+\".people (stub)\"},o=\"init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset group identify\".split(\" \"),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init(\"phc_njEQywr5sXkmRdehQ73GhzPA4LEX4Mae9Xsc8KVW62Da\",{api_host:\"https://us.i.posthog.com\",person_profiles:'identified_only'});" }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
