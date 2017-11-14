from bs4 import BeautifulSoup
import requests
import requests.exceptions
import random
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import gspread
from oauth2client.service_account import ServiceAccountCredentials
 

def ping(u):
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    page = requests.get(u)
    return page

def scrape(u):
    # use creds to create a client to interact with the Google Drive API
    scope = ['https://spreadsheets.google.com/feeds']
    creds = ServiceAccountCredentials.from_json_keyfile_name('client_secret.json', scope)
    client = gspread.authorize(creds)
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    page = requests.get(u)
    soup = BeautifulSoup(page.content, 'html.parser', from_encoding='utf-8')
    paragraphs = soup.find_all("p")

    bigList = []

    for para in paragraphs:
        para = para.getText()
        para = para.encode('ascii', 'ignore')
        para = para.decode('ascii', 'ignore')
        bigList.append(para)

    culledList = []

    cnt = 0

    week = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

    while(True):
        cnt += 1
        if cnt < 4:
            continue

        mtg = {}

        if cnt+6 > len(bigList):
            break

        for day in week:
            if day in bigList[cnt]:
                mtg['date'] = bigList[cnt]
                mtg['time'] = bigList[cnt+1]
                mtg['agenda'] = bigList[cnt+2]
                mtg['location'] = bigList[cnt+5].replace('(',"").replace(')',"")
                culledList.append(mtg)
                cnt += 5

    return culledList

# get persistent layer as list of lists
def pLayer():
    # Find a workbook by name and open the first sheet
    # Make sure you use the right name here.
    # use creds to create a client to interact with the Google Drive API
    scope = ['https://spreadsheets.google.com/feeds']
    creds = ServiceAccountCredentials.from_json_keyfile_name('client_secret.json', scope)
    client = gspread.authorize(creds)
    sheet = client.open("MeetingBot App").sheet1
    # Extract and print all of the values
    #list_of_vals = sheet.get_all_values()
    return sheet


def people():
    # use creds to create a client to interact with the Google Drive API
    scope = ['https://spreadsheets.google.com/feeds']
    creds = ServiceAccountCredentials.from_json_keyfile_name('client_secret.json', scope)
    client = gspread.authorize(creds)
    
    sheet = client.open("MeetingBot App").sheet1
    sheetList = sheet.get_all_values()
    rlen = len(sheetList)
    clen = len(sheetList[0])
    callers = {}
    for row in range(rlen):
        if row == 0:
            continue
        tmp = []
        for i in range(1,10):
            tmp.append(sheetList[row][i])
        callers['+' + sheetList[row][0]] = tmp
    return callers
        
# peoples = people()
# print(peoples)
# print('Done!')



