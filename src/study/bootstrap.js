// Select a frozen entry before any Sprint 2 source or CSS loads.
async function enterStudy(){
if(new URLSearchParams(location.search).get('v')==='1') {
 const {default:markup}=await import('./v1/page.html?raw');
 const page=new DOMParser().parseFromString(markup,'text/html');
 page.querySelectorAll('script').forEach(script=>script.remove());
 document.body.replaceChildren(...page.body.childNodes);
 document.title=page.title;
 await import('./v1/main.js');
} else await import('./main.js');
}
enterStudy();
