# Dynatrace Dashboard Powerups

This extension powers-up Dynatrace dashboards to enable cool new experimental features live, such as:
- Color changing tiles based on thresholds
- Color changing icons based on thresholds
- Tooltips on charts
- USQL values on world maps
   
*Please note: this is a community developed demonstration application. It is provided without any representations, warranties, or support from Dynatrace. If you have questions about this app, please post on our forum or create an [issue](https://github.com/LucasHocker/DynatraceDashboardPowerups/issues) on Github*

## Installation
1. Install the extension from the
[Chrome Store](https://chrome.google.com/webstore/detail/dynatrace-dashboard-power/dmpgdhbpdodhddciokonbahhbpaalmco)

![Chrome Store](Assets/chromeStore.png)

2. Click the puzzle icon and pin Powerups

![puzzle](Assets/clickPuzzlePiece.png)
![pin](Assets/pinExtension.png)

3. The icon will change from gray to blue when active (and purple when the extension has updated)

![inactive](Assets/inactive.png)
![active](Assets/active.png)

4. When a new update is released via Chrome Web Store it will automatically be updated. Google can take several days to approve an update to an Extension. If you wish to run the very latest version, change Library Location to GitHub in the Extension preferences.

## Configure extension
5. Click blue (or purple) powerup icon

![active](Assets/active.png)

6. Modify preferences

![popupMenu](Assets/popupMenu.png)

7. Click save. Note: you may need to refresh your page for changes to take effect.

## Powerup Howto
To add Powerups to your existing dashboards, you may add markup text in your dashboard tile titles. Alternatively, you may deploy dashboard packs with Powerups already included via the <a href="https://dynatrace.github.io/BizOpsConfigurator">BizOpsConfigurator</a>.

### Powerup List
- [Disclaimer](#Disclaimer)
- [Tooltips](#Tooltips)
- [Colorize](#Colorize)
- [Icons](#Icons)
- [Worldmaps](#Worldmaps)
- [Banner](#Banner)
- [Line chart threshold](#Line-chart-threshold)
- [USQL stacked bar chart](#USQL-Stacked-Bar-chart)
- [USQL colors](#USQL-colors)
- [Heatmap](#heatmap)
- [Sankey](#UserAction-Sankey-chart)
- [Vertical funnel](#Vertical-Funnel)
- [Math](#Math)
- [Date](#Date)
- [Gauge](#Gauge)
- [Compare](#Compare)
- [VLookup](#VLookup)
- [Stdev](#Stdev)
- [100stack](#100stack)
- [mCompare](#mCompare)
- [Image](#Image)
- [Background](#Background)

### Disclaimer
If you manually add markup, it is best practice to add a Powerup disclaimer tile so that users who do not yet have the Extension, will be directed to install it. To add the disclaimer, add the following to your dashboard JSON:
```
{
    "name": "Markdown",
    "tileType": "MARKDOWN",
    "configured": true,
    "bounds": {
        "top": 0,
        "left": 0,
        "width": 1254,
        "height": 76
    },
    "tileFilter": {},
    "markdown": "##\uD83D\uDC8E Powerup Enabled Dashboard \uD83D\uDC8E\n\n##  [Install Chrome Extension](https://chrome.google.com/webstore/detail/dynatrace-dashboard-power/dmpgdhbpdodhddciokonbahhbpaalmco)"
}
```
If you deploy dashboard packs from the BizOpsConfigurator, this tile is already added for you. Once the Extension loads this tile is hidden.

### Tooltips
Nothing required, just enable the extension as per above and refresh your browser on a dashboard.

Example:
![Tooltips](Assets/tooltips.png)

### Colorize
For Single Value Tiles, either custom chart or USQL, you can add color coding by adding markup to the title:
`!PU(color):base=high;warn=90;crit=80`

Explanation:
- `!PU(color):` this starts the markup
- `base=high` this is the base case for your metric, ie is it good to be `low` or `high`?
- `warn=90` this is the warning threshold, once breached color coding will be yellow
- `crit=80` this is the critical threshold, once breached color coding will be red
So in the example of availability, high is better. Greater than 90 would be green, 90 to 80 yellow, and 80 or less red.

Alternative: Absolute value comparison
- `base=abs,1`
- `warn=0.05`
- `crit=0.1`
This example would result in red: <= .9 or >= 1.1, yellow: <=.95 or >= 1.05, green otherwise.

Example:
![Colors](Assets/colors.png)

### Icons
This powerup renders icons in place of Markdown tiles. These icons change color to give a quick visual indication of environment / business health. For example, if payment processing was beyond a threshold hold, you might have a creditcard icon turn red. Here's how that might look:
```
[Extension Needed](https://github.com/LucasHocker/DynatraceDashboardPowerups)
!PU(svg):icon=creditcard;link=val3;base=high;warn=90;crit=85
```

Explanation:
- Link to extension: this lets users without the extension know to download it
- `!PU(svg):` this starts the markup
- `icon=` this refers to an SVG file in the 3rdParty/node_modules/@dynatrace/barista-icons folder
- `link=` this is used to link to a Single Value Tile to get the comparison value
- `base=` this is the base case for your metric, ie is it good to be low or high?
- `warn=` this is the warning threshold, once breached color coding will be yellow
- `crit=` this is the critical threshold, once breached color coding will be red
- `url=` (optional) if you want the icon to be clickable, give it a url. Recommend using this as last argument.
Just be sure to include the `!PU(link):` with a matching string in the desired Single Value Tile

Example:
![Icons](Assets/icons.png)

### Worldmaps
This powerup reloads the data in world maps with that from a USQL table. This allows you to map arbitrary things like revenue. It also enables click or scrollwheel to zoom. Click in an ocean to reset zoom. Add markup to your USQL table's title like this:
`Revenue !PU(map):color=green;link=Apdex`

Explanation:
- Revenue: title for your USQL table and Worldmap
- `!PU(map):` indicates this is a map powerup
- `color=` what color scale to use, e.g. "green" or "#E9422F"
- `link=` refers to the standard metric picked for the chart in the OOTB tile configuration. This allows you to have multiple worldmaps driven by multiple USQL tables

Example:
![World Map](Assets/worldmap.png)

### Banner
If you have multiple environment with dashboards up on screens and need an easy way of telling which is say Production and which one is say QA, you can color code the top of the dashboard. Use a dashboard tag like this:
`!PU(banner):color=purple`

Explanation:
- `!PU(banner):` indicates this dashboard tag is a banner powerup
- `color=` what color background to make the banner, e.g. "purple" or "#B6E5F8"

Example:
![Banner](Assets/banner.png)

### Line chart threshold
If you would like a chart that shows as one color above a threshold but a different color below, this powerup enables that. Add markup to to the chart title like so:
`!PU(line):thld=4000;hcol=green;lcol=red`

Explanation:
- `!PU(line):` indicates this linechart should have a threshold
- `thld=4000;` the threshold (Note: does not currently support units)
- `hcol=green;` the color above the threshold
- `lcol=red` the color below

Example:
![Line chart threshold](Assets/linethreshold.png)

### USQL Stacked Bar chart
This powerup switches to a stacked bar chart for a USQL result instead of stacked xaxis labels. Change the title like this:
`!PU(usqlstack):colors=green,blue,#aabbcc`

Explanation:
- `!PU(usqlstack):` - indicates the powerup
- `vals=` - (optional) align colors to specific values
- `colors=green,blue,#aabbcc` - assigns colors to each series
- `dataLabels=true` - (optional) display data label on each segment, defaults to no

Example:
![USQL Stacked Bar Chart](Assets/usqlstack.png)

### USQL colors
This powerup switches the color palette for a USQL chart . Change the title like this:
`!PU(usqlcolor):vals=satisfied,tolerating,frustrated;colors=green,yellow,red`

Explanation:
- `!PU(usqlcolor):` - indicates the powerup
- `vals=` - (optional) align colors to specific values
- `colors=green,blue,#aabbcc` - assigns colors to each series
- `dataLabels=true` - (optional) display data label on each segment, defaults to no

Example:
![USQL Color](Assets/usqlcolor.png)


### Heatmap
Currently this powerup can display a heatmap based on a **bar chart**. Eventually, it will be more generic.
```
Apdex (by app) !PU(heatmap):vals=.5,.7,.85,.94;names=Unacceptable,Poor,Fair,Good,Excellent;colors=#dc172a,#ef651f,#ffe11c,#6bcb8b,#2ab06f
```
```
Apdex (by app) !PU(heatmap):min=1;max=1000;minColor=#ffffff;maxColor=red
```

Explanation:
- `!PU(heatmap):` - denotes the heatmap powerup, anything prior to this is treated as the title
- `txtColor=` - (optional) what color text to use for data labels, defaults to white

&nbsp;&nbsp; Option 1 - Color classes:
- `vals=` - thresholds, should be N-1 of them
- `names=` - names for each area on the color axis, should be N of them
- `colors=` - CSS colors, should be N of them

&nbsp;&nbsp; Option 2 - Color gradient:
- `min=` & `max=` - (optional) min and max values for color axis, defaults to extreme values in the dataset
- `minColor` & `maxColor` - (optional) min and max colors, colors will be interpolated between these, defaults to white and blue

Examples:
![Apdex heatmap](Assets/heatmap.png)

![Gradient heatmap](Assets/heatmap2.png)

### UserAction Sankey chart
This powerup shows UserActions for your application, where they start, end, how many, do users circle in loops, etc. Create a USQL query, like this:
```
select useraction.name, useraction.matchingConversionGoals, useraction.apdexCategory, useraction.isEntryAction, useraction.isExitAction, useraction.stringProperties, useraction.doubleProperties, useraction.longProperties, useraction.dateProperties, useraction.duration, useraction.errorCount, userExperienceScore FROM usersession WHERE useraction.application="www.angular.easytravel.com" 
```

encoded with a title like this:
```
Angular Easy Travel UserJourneys !PU(sankey):link=sankey1;kpi=revenue;kpicurr=EUR
```

and Markdown tile to get swapped out like this:
```
[Extension Needed](https://github.com/LucasHocker/DynatraceDashboardPowerups)
!PU(link):sankey1
```

Explanation:
- `!PU(sankey):` - denotes the powerup source
- `link=` - points to markdown tile via the link powerup
- `kpi=` - the name of a User Action Property to be displayed in the main tooltip, usually something like revenue
- `kpicurr=` - (optional) how to format the KPI if its a currency, e.g. USD, EUR, CNY. If omitted, will format with max 2 fractional digits

Example:
![Sankey](Assets/sankey.png)

Notes:
- To increase/decrease the amount of clutter, use the plus and minus buttons. These slice the data in the USQL query.
- To get even more data from the USQL query, edit the dashboard JSON and add to the USQL tile (default 50, max 5000, more can result in slower load):
`"limit": 500`
- Be sure to click on useraction "nodes" in the graph for additional details and drilldowns into user sessions

### Vertical Funnel
This powerup changes the Dynatrace horizontal funnel into a vertical funnel. To utilize encode your title like so:
`Angular UserJourney !PU(funnel):mode=height;small=5;big=20;links=funnelinks`

Explanation:
- `mode=height` - which type of funnel visualization, options are `height`, `slope`, `bar`
- `small=` - minimum percentage to treat as a small positive or negative change, ie gray below this and light green/red above
- `big=` - minimum percentage to treat as a big positive or negative change, ie bold green/red above this
- `links=` - link to markdown tile with drilldown urls

Example:
![Funnel](Assets/colorFunnel.png) ![FunnelLinks](Assets/funnelLinks.png)

### Math
This powerup allows you to do complex math based on other values on the dashboard. See [math-expression-evaluator](http://bugwheels94.github.io/math-expression-evaluator/#supported-maths-symbols) for help with math expressions. 

Syntax:
`!PU(math):exp=(x1+x2+x3+x4)/4;scope=x1,x2,x3,x4:link4;color=blue`

Explanation:
- `!PU(math):` - denotes a math powerup
- `exp=` - a math expression
- `scope=` - list of any variables used in your expression. Optionally, you may have seperate variable names from link name, e.g. `x4:link4`, otherwise assume var and link are the same string e.g. `x1`
- `color=` - (optional) a valid CSS color, defaults to white
- `size=` - (optional) a valid CSS font-size, defaults to 36px
- `base=` - (optional) if using thresholds, define whether the base (normal) is `low` or `high`
- `warn=` - (optional) if using thresholds, warning threshold, once breached color coding will be yellow
- `crit=` - (optional) if using thresholds, critical threshold, once breached color coding will be red

Example:
![Math](Assets/mathPU.png)

Note:
- If you encounter issues with dissimilar units, change the units in the chart
![Units](Assets/units.png)

### Date
This powerup allows you to use Dynatrace date format strings and format in Markdown tiles. 

Syntax:
`!PU(date):res=now-7d/d;fmt=YYYY-MM-DD;color=green`

Explanation:
- `!PU(date):` - denotes the date powerup
- `res=` - resolve this date string, click on global time selector for help with syntax
- `fmt=` - display format, see [date-fns](https://date-fns.org/v1.9.0/docs/format)
- `color=` - a valid CSS color

Example:
![Date](Assets/datePU.png)

### Gauge
This powerup converts a Single Value Tile into a solid gauge. 

Syntax:
`Memory !PU(gauge):stops=.5,.75,.9;colors=green,yellow,red;min=0;max=100`

Explanation:
- `!PU(gauge):` - denotes the gauge powerup
- `stops=` - color stops as a percentage of the max, valid values rante 0 through 1
- `colors=` - colors for color stops
- `min=` - left end of the gauge, defaults to 0
- `max=` - right end of the gauage, defaults to 100

Example:
![Gauge](Assets/gauge.png)

### Compare
This powerup compares a Single Value Tile (SVT) to another SVT and applies coloring based on the comparison. 

Syntax:
`Active users !PU(compare):link=link2;lt=red;gt=green;eq=yellow !PU(link):link1`

Explanation:
- `!PU(compare):` - denotes the compare powerup
- `link=link2` - references another SVT to compare against
- `lt=red` - a color if this SVT is less than the other
- `gt=green` - a color if this SVT is greater than the other
- `eq=yellow` - a color if this SVT is equal to the other
- `!PU(link):link1` - this is a reference back from the other SVT which is also using !PU(compare)

Example:
![Compare](Assets/compare.png)

### VLookup
This powerup extracts a value from a USQL table, and optionally compares it to another table value.

Syntax:
`!PU(vlookup):link=table;val=/easytravel/rest/journeys/;col=1;compareTable=table;compareVal=/easytravel/rest/locations;compareCol=1;lt=green;gt=red;eq=yellow`

Explanation:
- `!PU(vlookup):` - denotes this powerup
- `link=table` - reference the table tile, ie put `!PU(link):table` in the title of the USQL tile
- `val=...` - value to look for in the first column of the table
- `col=1` - column number (or name) of where to look up the value, ie 1 is 2nd column of the table

Options:
- `color=blue` - what color to make the text
- `row=1` - (optional) ignore val and instead lookup value by row number. Starting at 1 from top or -1 from bottom.

Optional comparison:
- `compareTable=table` - reference the table tile, ie put `!PU(link):table` in the title of the USQL tile
- `compareVal=...` - value to look for in the first column of the table
- `compareCol=1` - column number (or name) of where to look up the value, ie 1 is 2nd column of the table
- `lt=green` - color to make the text, if the value is lower than the comparison value
- `eq=yellow` - color to make the text, if the value is equal than the comparison value
- `gt=red` - color to make the text, if the value is greater than the comparison value

Optional thresholds, mutually exclusive of comparison:
- `base=high` this is the base case for your metric, ie is it good to be low or high?
- `warn=90` this is the warning threshold, once breached color coding will be yellow
- `crit=80` this is the critical threshold, once breached color coding will be red

Example:
![vlookup](Assets/vlookup.png)

### Stdev
This powerup computes standard deviation (or other value) over a series. Apply to a USQL table.

Syntax:
`!PU(stdev):color=orange;output=min,avg,median,90%,max,sum,stdev`

Explanation:
- `!PU(stdev):` - denotes this powerup
- `output=min,avg,median,90%,max,sum,stdev` - which function(s) to output, defaults to stdev
- `color=orange` - what color to make the text, defaults to white

Example:
![stdev](Assets/stdev.png)

### 100 Stack
This powerup switches stacked column charts to 100% stacked charts.

Syntax:
`!PU(100stack):pad=0.1`

Explanation
- `!PU(100stack):` - denotes this powerup
- `pad=0.1` - (optional) override standard padding between points. Note: small padding can lead to uneven looking spacing due to pixel rounding from antialiasing -- use a larger graph to avoid.

Example:
![100stack](Assets/100stack.png)

### Table
This powerup enables exporting USQL tables to CSV/XLS and sortable columns.

Syntax:
`!PU(table):`

Explanation:
- `!PU(table):` - denotes this powerup
- `col=` - (optional) default sort order, e.g. 1 sort by first column ascending, -5 sort by fifth column descending

Example: 
![tablexls](Assets/table.png)

### Background
This powerup changes the background of the dashdoard to an external image. This should be placed in an offscreen markdown tile. The tile will auto-hide when the extension runs.

Syntax:
`!PU(background):url=https://myurl.com/myimage.png`

Explanation:
- `!PU(background):` - denotes this powerup
- `url=` - url of the image to load

Note: you should limit usage to only trusted image sources and keep file size reasonable

### Image
This powerup adds an external image. This swaps a markdown tile with the image.

Syntax:
`!PU(background):url=https://myurl.com/myimage.png out=https://www.dynatrace.com`

Explanation
- `!PU(background):` - denotes this powerup
- `url=` - url of the image to load
- `out=` - (optional) makes image a clickable link. Where should the link go. Also note the space delimiter.

Note: you should limit usage to only trusted image sources and keep file size reasonable

### mCompare
This powerup compares multiple SVTs. It has two modes: `outlier` and `scale`. Outlier mode highlights the low and high; whereas, scale uses color to show distance from extremes.

Syntax:
- `!PU(mcompare):links=link1,link2,link3,link4,link5;low=green;high=red;other=gray !PU(link):link1`
- `!PU(mcompare):mode=scale;links=linkA,linkB,linkC,linkD,linkE;low=blue;high=green !PU(link):linkA`

Explanation:
- `!PU(mcompare):` - denotes this powerup
- `mode=scale` - which mode, defaults to `outlier`
- `links=` - list of links to SVTs
- `low=` - CSS color for lowest value
- `high=` - CSS color for highest value
- `other=` - CSS color for middle values in outlier mode

Example: 
![mcompare](Assets/mcompare.png)

### FunneColors
This powerup retains the existing funnel design but allows changing the colors. You can either specify `colors` directly or specify a `scale` between two colors.

Syntax:
- `!PU(funnelcolors):colors=#9cd575,#4fd5e0,#2ab6f4,#a972cc`
- `!PU(funnelcolors):scale=#14a8f5,#6bcb8b`

Explanation:
- `!PU(funnelcolors):` - denotes this powerup
- `colors=` - specify colors for each funnel step from left to right
- `scale=` - specify a color scale starting with the first color and ending with the last

Example:
![funnelcolors](Assets/funnelcolors.png)