#!/usr/bin/env python

import csv, os, os.path, MySQLdb
import geodict_config
from geodict_lib import *

def wipe_and_init_database(cursor):
    print "before drop"
    cursor.execute("""DROP DATABASE geodict;""")
    print "before create"
    cursor.execute("""CREATE DATABASE geodict;""")
    print "before use"
    cursor.execute("""USE geodict;""")

def load_cities(cursor):
    print "load cities"

    cursor.execute("""CREATE TABLE IF NOT EXISTS cities (
        city VARCHAR(80),
        country CHAR(2),
        PRIMARY KEY(city, country),
        region_code CHAR(2),
        population INT,
        lat FLOAT,
        lon FLOAT,
        last_word VARCHAR(32),
        INDEX(last_word(10)));
    """)
    
    reader = csv.reader(open(geodict_config.source_folder+'worldcitiespop.csv', 'rb'))
    print "start loop"
    i = 0
    for row in reader:
        i = i+1
        print i
        try:
            country = row[0]
            city = row[1]
            region_code = row[3]
            population = row[4]
            lat = row[5]
            lon = row[6]
        except:
            continue

        if population is '':
            population = 0

        city = city.strip()

        last_word, index, skipped = pull_word_from_end(city, len(city)-1, False)

        cursor.execute("""
            INSERT IGNORE INTO cities (city, country, region_code, population, lat, lon, last_word)
                values (%s, %s, %s, %s, %s, %s, %s)
            """,
            (city, country, region_code, population, lat, lon, last_word))

def load_countries(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS countries (
        country VARCHAR(64),
        PRIMARY KEY(country),
        country_code CHAR(2),
        lat FLOAT,
        lon FLOAT,
        last_word VARCHAR(32),
        INDEX(last_word(10)));
    """)
    
    reader = csv.reader(open(geodict_config.source_folder+'countrypositions.csv', 'rb'))
    country_positions = {}

    i = 0
    for row in reader:
        i = i+1                
        print i
        try:
            country_code = row[0]
            lat = row[1]
            lon = row[2]
        except:
            continue

        country_positions[country_code] = { 'lat': lat, 'lon': lon }
        
    reader = csv.reader(open(geodict_config.source_folder+'countrynames.csv', 'rb'))

    i = 0
    for row in reader:
        i = i+1                
        print i
        try:
            country_code = row[0]
            country_names = row[1]
        except:
            continue    

        country_names_list = country_names.split(' | ')
        
        lat = country_positions[country_code]['lat']
        lon = country_positions[country_code]['lon']
        
        for country_name in country_names_list:
        
            country_name = country_name.strip()
            
            last_word, index, skipped = pull_word_from_end(country_name, len(country_name)-1, False)

            cursor.execute("""
                INSERT IGNORE INTO countries (country, country_code, lat, lon, last_word)
                    values (%s, %s, %s, %s, %s)
                """,
                (country_name, country_code, lat, lon, last_word))
        

def load_regions(cursor):
    cursor.execute("""CREATE TABLE IF NOT EXISTS regions (
        region VARCHAR(64),
        PRIMARY KEY(region),
        region_code CHAR(4),
        country_code CHAR(2),
        lat FLOAT,
        lon FLOAT,
        last_word VARCHAR(32),
        INDEX(last_word(10)));
    """)

    reader = csv.reader(open(geodict_config.source_folder+'us_statepositions.csv', 'rb'))
    us_state_positions = {}

    i = 0
    for row in reader:
        i = i+1                
        print i
        try:
            region_code = row[0]
            lat = row[1]
            lon = row[2]
        except:
            continue

        us_state_positions[region_code] = { 'lat': lat, 'lon': lon }
    
    reader = csv.reader(open(geodict_config.source_folder+'us_statenames.csv', 'rb'))

    country_code = 'US'

    i = 0
    for row in reader:
        i = i+1                
        print i
        try:
            region_code = row[0]
            state_names = row[2]
        except:
            continue    

        state_names_list = state_names.split('|')
        
        lat = us_state_positions[region_code]['lat']
        lon = us_state_positions[region_code]['lon']
        
        for state_name in state_names_list:
    
            state_name = state_name.strip()
            
            last_word, index, skipped = pull_word_from_end(state_name, len(state_name)-1, False)
        
            cursor.execute("""
                INSERT IGNORE INTO regions (region, region_code, country_code, lat, lon, last_word)
                    values (%s, %s, %s, %s, %s, %s)
                """,
                (state_name, region_code, country_code, lat, lon, last_word))

cursor = get_database_connection()
wipe_and_init_database(cursor)
load_cities(cursor)
load_countries(cursor)
load_regions(cursor)
cursor.connection.commit()