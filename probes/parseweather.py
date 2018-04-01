import sys

# The format description is here:
# https://www1.ncdc.noaa.gov/pub/data/noaa/ish-format-document.pdf
# Note that positions in the doc are 1-based, python is zero-based.

# Print A CSV key (Date/Time are UTC)
print "Date,Time,Temp,dewpt,windspd,winddir,slp"

for line in sys.stdin:
  print line[15:23] + ",", line[23:27] + ",", # date and time (UTC)
  print line[87:91] + "." + line[92] + ",",   # temperature (deg C, +999.9 == no data)
  print line[93:97] + "." + line[97] + ",",   # dew pt temperature (deg C, +999.9 == no data)
  print line[65:68] + "." + line[68] + ",",   # Wind speed, M per sec
  print line[60:63] + ",",                    # Wind direction angle
  print line[99:103] + "." + line[103]  # Sea level pressure HPa (khuf is at 180M)
  
