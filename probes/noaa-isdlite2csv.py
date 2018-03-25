#!/usr/bin/python

#
# This parses weather downloaded from NOAA
# into a handy CSV format.
#
# March 2018
# Sid Stamm <sidstamm@gmail.com>
#

import sys
import string

def decodeSkyCondition(code):
    code = int(code) % 10
    # Return pct and text decoding
    if code == 9 or code == 8:
        return (1.0, "OVC")
    elif code == 7:
        return (0.9, "BKN")
    elif code == 6:
        return (0.75, "BKN")
    elif code == 5:
        return (0.6, "BKN")
    elif code == 4:
        return (0.5, "SKT")
    elif code == 3:
        return (0.4, "SKT")
    elif code == 2:
        return (0.25, "FEW")
    elif code == 1:
        return (0.1, "FEW")
    elif code == 0:
        return (0, "SKC")

    return (-9999, "UNK")


print "Date,Time,Temp,dewpt,windspd,winddir,slp,skycover,skcnd,precip1h"

#reads from stdin
for l in sys.stdin:
    print "%s%s%s," % (l[0:4], l[5:7], l[8:10]),        #date
    print "%s01,"   % (l[11:13]),                       #time
    print "%s.%s,"  % (l[15:18].strip(), l[18:19]),     #air temp (/10)
    print "%s.%s,"  % (l[21:24].strip(), l[24:25]),     #dew pt (/10)
    print "%s.%s,"  % (l[37:42].strip(), l[42:43]),     #wind speed (m/s/10)
    print "%s,"  % (l[31:37].strip()),                  #wind dir (degrees)
    print "%s.%s,"  % (l[25:30].strip(), l[30:31]),     #sea level pressure (hPa)
    print "%s, %s" % decodeSkyCondition(l[43:49]),
    print "%s,"  % (l[49:55].strip()),                  #1h precip (mm - trace is -1)
    print ""

