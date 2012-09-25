// The Template Loader. Used to asynchronously load templates located in separate .html files
window.templateLoader = {

    load: function(views, callback) {

        var deferreds = [];

        $.each(views, function(index, view) {
            
            var name, path;

            if (view instanceof Array) {                
                name = view[0]
                path=view[1]
            }
            else {
               name = view
               path = ""
            }

            if (window[name]) {
                var url = 'tpl/' + path + name + '.html'                
                deferreds.push($.get(url, function(data) {                   
                    window[name].prototype.template = _.template(data);
                }, 'html'));                
            } else {
                alert(name + " not found");
            }
        });

        $.when.apply(null, deferreds).done(callback);
    }

};

consts = 
{
    page_size: 10
}

var utils = {}

utils.ignoreKeyForSearch = function(code) {
    return (code>=9 && code<=47 && code!=32)
}

utils.reportVisit = function(fragment) {  
    if (window._gaq !== undefined) {        
      window._gaq.push(['_trackPageview', fragment]);
    }
}

utils.trackEvent = function(category, action, label) {
    if (window._gaq !== undefined) {
      _gaq.push(['_trackEvent', category, action, label])
    }
}


utils.regionsMap = {
    'United States': 'US',
    'United Kingdom': 'europe',
    'Germany': 'europe',
    'China': 'asia',
    'Canada': 'americas',
    'France': 'europe',
    'Brazil': 'americas',
    'Japan': 'asia',
    'Russia': 'europe',
    'Australia': 'oceania',
    'India': 'asia',
    'Spain': 'europe',
    'Sweden': 'europe',
    'Italy': 'europe',
    'Ukraine': 'europe',
    'Poland': 'europe',
    'Netherlands': 'europe',
    'Norway': 'europe',
    'Switzerland': 'europe',
    'The Netherlands': 'europe',
    'Argentina': 'americas',
    'Belgium': 'europe',
    'Denmark': 'europe',
    'Portugal': 'europe',
    'Taiwan': 'asia',
    'South Korea': 'asia',
    'Austria': 'europe',
    'Mexico': 'americas',
    'Finland': 'europe',
    'Turkey': 'asia',
    'New Zealand': 'oceania',
    'Czech Republic': 'europe',
    'Romania': 'europe',
    'Indonesia': 'asia',
    'Singapore': 'asia',
    'Ireland': 'europe',
    'South Africa': 'africa',
    'Philippines': 'asia',
    'Greece': 'europe',
    'Chile': 'americas',
    'Hong Kong': 'asia',
    'Israel': 'asia',
    'Hungary': 'europe',
    'Belarus': 'europe',
    'Bulgaria': 'europe',
    'Malaysia': 'asia',
    'Colombia': 'americas',
    'Thailand': 'asia',
    'Vietnam': 'asia',    
    'Estonia': 'europe',
    'Croatia': 'europe',
    'Serbia': 'europe',
    'Iran': 'asia',
    'Egypt': 'africa',
    'Venezuela': 'americas',
    'Peru': 'americas',
    'Slovakia': 'europe',
    'Slovenia': 'europe',
    'Pakistan': 'asia',
    'Uruguay': 'americas',
    'Iceland': 'europe',
    'Republic of Latvia': 'europe',
    'Republic of Lithuania': 'europe',
    'Bangladesh': 'asia',
    'Sri Lanka': 'asia',
    'Costa Rica': 'americas',
    'Latvia': 'europe',
    'Nepal': 'asia',
    'Kenya': 'africa',
    'Nigeria': 'africa',
    'Morocco': 'africa',
    'Kazakhstan': 'asia',
    'Dominican Republic': 'americas',
    'Jordan': 'asia',
    'Guatemala': 'americas',
    'Moldova': 'europe',
    'Tunisia': 'africa',
    'Cyprus': 'europe',
    'Luxembourg': 'europe',
    'Lithuania': 'europe',
    'Georgia': 'asia',
    'Macedonia': 'europe',
    'United Arab Emirates': 'asia',
    'Bosnia and Herzegovina': 'europe',
    'Ecuador': 'americas',
    'Saudi Arabia': 'asia',
    'Bolivia': 'americas',
    'Ghana': 'africa',
    'Paraguay': 'americas',
    'Jamaica': 'americas',
    'Algeria': 'africa',
    'Macau-China': 'asia',
    'Cuba': 'americas',
    'Kuwait': 'asia',
    'Aruba': '',
    'Uganda': 'africa',
    'Lebanon': 'asia',
    'Uzbekistan': 'asia',
    'Nicaragua': 'americas',
    'Honduras': 'americas',
    'Armenia': 'asia',
    'Cambodia': 'asia',
    'Myanmar': 'asia',
    'Senegal': 'africa',
    'Mauritius': '',
    'Syria': 'asia',
    'Mongolia': 'asia',
    'Kyrgyzstan': 'asia',
    'Guadeloupe': '',
    'St Helena Ascension and Tristan da Cunha': '',
    'Trinidad and Tobago': 'africa',
    'Azerbaijan': 'asia',
    'El Salvador': 'americas',
    'Albania': 'europe',
    'Montenegro': 'europe',
    'Panama': 'americas',
    'Malta': 'europe',
    'Solomon Islands': '',
    'Palestinian Territories': 'asia',
    'Bahrain': 'asia',
    'Benin': 'africa',
    'Afghanistan': 'africa',
    'Maldives': '',
    'Madagascar': '',
    'Cameroon': 'africa',
    'Cook Islands': '',
    'Bermuda': '',
    'Fiji': '',
    'Qatar': 'africa',
    'Namibia': 'africa',
    'Reunion': '',
    'Hong Kong-China': 'asia',
    'Botswana': '',
    'Mozambique': 'africa',
    'Oman': 'africa',
    'Martinique': '',
    'The Gambia': 'africa',
    'Ethiopia': 'africa',
    'Gabon': 'africa',
    'Congo': 'africa',
    'French Guiana': 'africa',
    'Rwanda': 'africa',
    'Tanzania': 'africa',
    'French Polynesia': '',
    'Faroe Islands': '',
    'Antarctica': '',
    'Malawi': 'africa',
    'Tonga': 'africa',
    'Zimbabwe': '',
    'Democratic Republic of Congo': 'africa',
    'Guyana': 'asia',
    'Somalia': 'africa',
    'Ivory Coast': 'africa',
    'Chad': 'africa',
    'Monaco': 'europe',
    'Laos': 'africa',
    'Burkina Faso': 'africa',
    'Yemen': 'asia',
    'Greenland': '',
    'The Bahamas': 'americas',
    'Sudan': 'asia',
    'Barbados': '',
    'Bhutan': '',
    'Turkmenistan': 'asia',
    'Luxemburg': 'europe',
    'Netherlands Antilles': '',
    'Brunei': 'africa',
    'Angola': 'africa',

}