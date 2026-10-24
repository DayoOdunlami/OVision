// Sprint 1 is a frozen source copy; only its nested app import paths differ.
if(new URLSearchParams(location.search).get('v')==='1') import('./v1/main.js');
else import('./main.js');
