# Geodict
# Copyright (C) 2010 Pete Warden <pete@petewarden.com>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.

# The location of the source data to be loaded into your database
source_folder = './source_data/'

# Your MySQL user credentials
user = 'root'
password = ''

# The address and port number of your database server
host = 'localhost'
port = 0

# The name of the database to create
database = 'geodict'

# The maximum number of words in any name
word_max = 3

# Words that provide evidence that what follows them is a location
location_words = {
    'at': True,
    'in': True
}