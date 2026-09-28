import json,subprocess,re,sys
heads=json.load(open('heads.json'))
n=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo','r.pdf'],capture_output=True,text=True).stdout).group(1))
norm=lambda s:re.sub(r'\s+','',s)
pages=[norm(subprocess.run(['pdftotext','-f',str(k),'-l',str(k),'-layout','r.pdf','-'],capture_output=True,text=True).stdout) for k in range(1,n+1)]
toc_end=next(k for k,t in enumerate(pages) if 'VIREXONTechnologiesestunePME' in t)-1
res={};miss=[]
start=toc_end+1
for h in heads:
    hn=norm(h)
    found=None
    for k in range(start,n):
        if hn in pages[k] or hn[:60] in pages[k]:
            found=k;break
    if found is None: miss.append(h)
    else: res[h]=found+1; start=found
json.dump(res,open('pages.json','w'),ensure_ascii=False)
print('pages',n,'toc fin page',toc_end+1,'trouvés',len(res),'/',len(heads),'manquants',miss[:5])
