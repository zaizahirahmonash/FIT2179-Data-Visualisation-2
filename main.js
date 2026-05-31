/*1. Global Circuit Map: The Altitude Paradox*/
const mapSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 1000,  
  height: 450,
  background: "transparent",
  padding: {
    right: 120
  },

  projection: {
    type: "equalEarth"
  },
  resolve: {
  scale: {
    size: "independent"
    }
  },

  //slider to filter circuits by altitude
  params: [
    {
      name: "minAltitude",
      value: 0, 
      bind: {
        input: "range",
        min: 0,
        max: 2227,
        step: 50,
        name: "Minimum Altitude (m): "
      }
    }
  ],

  layer: [
    {
      data: {
        url: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
        format: {
          type: "topojson",
          feature: "countries"
        }
      },
      mark: {
        type: "geoshape",
        fill: "#e0e0e0",
        stroke: "#ffffff"
      }
    },
    {
      data: {
        url: "circuits.csv", 
        format: { type: "csv" }
      },

      transform: [
        { filter: "datum.alt >= minAltitude" }
      ],
      
      mark: {
        type: "circle",
        opacity: 0.75, 
        stroke: "#000000",
        strokeWidth: 0.8
      },
      encoding: {
        longitude: { field: "lng", type: "quantitative" },
        latitude: { field: "lat", type: "quantitative" },
        
        size: {
          field: "alt",
          type: "quantitative",
          scale: { 
            domain: [0, 2500], 
            range: [60, 500] 
          },
          legend: null
        },

        color: {
          field: "alt",
          type: "quantitative",
          scale: {
            domain: [0, 2500],
            range: ["#ff9999", "#e10600", "#7a0000"]
          },
          legend: {
            title: "Altitude (m)",
            titleFont: "Arial",
            titleFontSize: 11,
            labelFont: "Arial",
            values: [0, 500, 1000, 1500, 2000, 2227],
            orient: "right", 
            symbolStrokeColor: "#000000",
            symbolFillColor: "#e10600"
          } 
        },
        
        tooltip: [
          { field: "name", type: "nominal", title: "Circuit" },
          { field: "location", type: "nominal", title: "Location" },
          { field: "country", type: "nominal", title: "Country" },
          { field: "alt", type: "quantitative", title: "Altitude (m)" }
        ]
      }
    }
  ]
};

vegaEmbed("#GlobalMapChart", mapSpec);

/* 2. All-Time Famous Constructors and Total Wins */
const lollipopSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "A lollipop chart showing true, accurate total wins for top constructors since 2000.",
  width: 450, 
  height: 400, 
  background: "#f8f9fa", 

  data: {
    url: "constructor_standings.csv?v=1",
    format: { 
      type: "csv",
      parse: { "wins": "number", "constructorId": "number", "raceId": "number" } 
    }
  },

  transform: [
    {
      lookup: "raceId",
      from: {
        data: { 
          url: "races.csv", 
          format: { type: "csv", parse: { "raceId": "number", "year": "number" } } 
        },
        key: "raceId",
        fields: ["year"]
      }
    },
    
    { filter: "datum.year >= 2000" },
    {
      lookup: "constructorId",
      from: {
        data: {
          url: "constructors.csv",
          format: { type: "csv", parse: { "constructorId": "number" } } 
        },
        key: "constructorId",
        fields: ["name"]
      }
    },
    { filter: "isValid(datum.name)" },
    {
      aggregate: [{ op: "max", field: "wins", as: "individual_max_wins" }],
      groupby: ["name"]
    },

    {
      calculate: "indexof(['Ferrari', 'McLaren', 'Williams', 'Mercedes', 'Red Bull', 'Renault'], datum.name) >= 0 ? datum.name : 'Other Teams'",
      as: "top_constructors"
    },
    {
      aggregate: [{ op: "max", field: "individual_max_wins", as: "total_wins" }],
      groupby: ["top_constructors"]
    },
    
    { filter: "datum.total_wins > 0" }
  ],

  layer: [
    {
      mark: { type: "rule", strokeWidth: 2, color: "#b0b0b0" },
      encoding: {
        x: { field: "total_wins", type: "quantitative", title: "Total Race Wins (Since 2000)" },
        y: { field: "top_constructors", type: "nominal", sort: "-x" }
      }
    },
    {
      mark: { type: "circle", size: 150, opacity: 1 },
      encoding: {
        x: { field: "total_wins", type: "quantitative" },
        y: { field: "top_constructors", type: "nominal", sort: "-x" },
        color: {
          field: "top_constructors",
          type: "nominal",
          scale: {
            domain: ["Ferrari", "McLaren", "Mercedes", "Red Bull", "Renault", "Williams", "Other Teams"],
            range: ["#dc0000", "#ff8700", "#00d2be", "#0600ef", "#ffda03", "#005aff", "#9ca3af"]
          },
          legend: null
        },
        tooltip: [
          { field: "top_constructors", type: "nominal", title: "Team Group" },
          { field: "total_wins", type: "quantitative", title: "Wins in Era", format: "," }
        ]
      }
    },
    //text annotation
    {
      mark: { type: "text", align: "left", dx: 10, fontSize: 12, fontWeight: "bold" },
      encoding: {
        x: { field: "total_wins", type: "quantitative" },
        y: { field: "top_constructors", type: "nominal", sort: "-x" },
        text: { field: "total_wins", type: "quantitative" }
      }
    }
  ]
};

vegaEmbed("#ConstructorWin", lollipopSpec);

/*12. Australian Most Successful Drivers by Points*/
const aussieDriversSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Total career championship points by Australian F1 drivers with annotations.",
  width: 400,
  height: 300,
  background: "#f8f9fa",

  data: {
    url: "drivers.csv",
    format: { type: "csv" }
  },

  transform: [
    { filter: "datum.nationality === 'Australian'" },
    { calculate: "datum.forename + ' ' + datum.surname", as: "driver_name" },
    {
      calculate: "(datum.driver_name == 'Mark Webber' || datum.driver_name == 'Daniel Ricciardo') ? 'Red Bull' : (datum.driver_name == 'Alan Jones' ? 'Williams' : (datum.driver_name == 'Oscar Piastri' ? 'McLaren' : 'Other'))",
      as: "team"
    },
    {
      lookup: "driverId",
      from: {
        data: { url: "driver_standings.csv", format: { type: "csv", parse: { "points": "number", "raceId": "number" } } },
        key: "driverId",
        fields: ["points", "raceId"]
      }
    },
    { calculate: "isValid(datum.points) ? datum.points : 0", as: "clean_points" },
    { aggregate: [{ op: "max", field: "clean_points", as: "season_max_points" }], groupby: ["driver_name", "team", "raceId"] },
    { aggregate: [{ op: "sum", field: "season_max_points", as: "total_career_points" }], groupby: ["driver_name", "team"] },
    { filter: "datum.total_career_points > 0" }
  ],

  layer: [
    {
      mark: { type: "bar", cornerRadiusEnd: 4 },
      encoding: {
        x: { field: "total_career_points", type: "quantitative", title: "Total Career Championship Points", axis: { grid: true } },
        y: { field: "driver_name", type: "nominal", title: "Driver", sort: "-x" },
        color: {
          field: "team",
          type: "nominal",
          title: "Constructor",
          scale: {
            domain: ["Red Bull", "Williams", "McLaren", "Other"],
            range: ["#0600ef", "#005aff", "#ff8700", "#808080"]
          },
          legend: { orient: "bottom", direction: "horizontal", titleAnchor: "middle" }
        }
      }
    },
    {
      mark: { type: "text", align: "left", dx: 5, fontSize: 11, fontWeight: "bold", color: "#374151" },
      encoding: {
        x: { field: "total_career_points", type: "quantitative" },
        y: { field: "driver_name", type: "nominal", sort: "-x" },
        text: { field: "total_career_points", type: "quantitative", format: ".1f" }
      }
    }
  ]
};

vegaEmbed("#aussieDriverChart", aussieDriversSpec);

/*6. Average Pit Stops per Driver/Car Across Recent Modern Eras (2018-Present)*/
const pitStopHeatmapSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Heatmap tracing normalized average pit stop frequencies per driver across circuits.",
  width: 320,
  height: 380,
  background: "#f8f9fa",
  data: {
    url: "pit_stops.csv",
    format: { type: "csv", parse: { "raceId": "number", "driverId": "number" } }
  },

  transform: [
    {
      lookup: "raceId",
      from: {
        data: { url: "races.csv", format: { type: "csv", parse: { "raceId": "number", "year": "number" } } },
        key: "raceId",
        fields: ["name", "year"]
      }
    },
    { filter: "datum.year >= 2018" },
    { filter: "isValid(datum.name)" },
    {
      aggregate: [{ op: "count", as: "driver_stops_count" }],
      groupby: ["name", "year", "driverId"]
    },
    {
      aggregate: [{ op: "mean", field: "driver_stops_count", as: "avg_stops_per_driver" }],
      groupby: ["name", "year"]
    }
  ],

  mark: { type: "rect", stroke: "#ffffff", strokeWidth: 0.5 },
  
  encoding: {
    x: {
      field: "year",
      type: "ordinal",
      title: "Racing Season",
      axis: { labelAngle: 0 }
    },
    y: {
      field: "name",
      type: "nominal",
      title: "Circuit Location"
    },
    color: {
      field: "avg_stops_per_driver",
      type: "quantitative",
      title: "Avg Stops / Car",
      scale: { 
        scheme: "reds",
        domain: [1, 4]
      },
      legend: {
        orient: "bottom",
        gradientLength: 200,   
        gradientThickness: 12, 
        labelFontSize: 10,
        titleFontSize: 11,
        offset: 15             
      }
    },
    tooltip: [
      { field: "name", type: "nominal", title: "Circuit" },
      { field: "year", type: "ordinal", title: "Year" },
      { field: "avg_stops_per_driver", type: "quantitative", title: "Avg Stops Per Car", format: ".1f" }
    ]
  }
};

vegaEmbed("#pitStopHeatmapChart", pitStopHeatmapSpec);

/*3. Constructor Dominance Over Time*/
const constructorDominanceSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Chronological shift in constructor points dominance across modern racing eras.",
  width: 400,
  height: 400,
  background: "#f8f9fa",

  data: {
    url: "constructor_standings.csv",
    format: { 
      type: "csv",
      parse: { "raceId": "number", "constructorId": "number", "points": "number" }
    }
  },

  params: [
    {
      name: "selectedYear",
      value: 2024, 
      bind: {
        element: "#seasonSelect"
      }
    }
  ],

  transform: [
    {
      lookup: "raceId",
      from: {
        data: { 
          url: "races.csv", 
          format: { type: "csv", parse: { "raceId": "number", "year": "number" } } 
        },
        key: "raceId",
        fields: ["year"]
      }
    },

    { filter: "datum.year >= 2000 && datum.year <= selectedYear" },
    
    {
      lookup: "constructorId",
      from: {
        data: { 
          url: "constructors.csv", 
          format: { type: "csv", parse: { "constructorId": "number" } } 
        },
        key: "constructorId",
        fields: ["name"]
      }
    },
    {
      aggregate: [{ op: "sum", field: "points", as: "yearly_constructor_points" }],
      groupby: ["year", "name"]
    },
    {
      calculate: "datum.name && indexof(['Ferrari', 'McLaren', 'Williams', 'Mercedes', 'Red Bull', 'Renault'], datum.name) >= 0 ? datum.name : 'Other Teams'",
      as: "top_constructors"
    },
    {
      aggregate: [{ op: "sum", field: "yearly_constructor_points", as: "yearly_points" }],
      groupby: ["year", "top_constructors"]
    }
  ],

  mark: { type: "line", strokeWidth: 2.5, interpolate: "linear" },
  
  encoding: {
    x: {
      field: "year",
      type: "quantitative",
      title: "Racing Season",
      axis: { format: "d", grid: false }
    },
    y: {
      field: "yearly_points", 
      type: "quantitative",
      title: "Total Championship Points Scored",
      axis: { grid: true }
    },
    color: {
      field: "top_constructors",
      type: "nominal",
      title: "Constructor",
      scale: {
        domain: ["Ferrari", "McLaren", "Mercedes", "Red Bull", "Renault", "Williams", "Other Teams"],
        range: ["#dc0000", "#ff8700", "#00d2be", "#0600ef", "#ffda03", "#005aff", "#9ca3af"]
      }
    },
    tooltip: [
      { field: "year", type: "quantitative", title: "Season" },
      { field: "top_constructors", type: "nominal", title: "Team" },
      { field: "yearly_points", type: "quantitative", title: "Points Accumulation", format: "," }
    ]
  }
};

vegaEmbed("#dominanceChart", constructorDominanceSpec);

/* 4. Chasing the Apex: The Global Footprint of F1 Drivers*/
const driverMapSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 800,
  height: 450,
  background: "transparent",
  projection: {
    type: "equalEarth"
  },
  layer: [

    {
      data: {
        url: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
        format: {
          type: "topojson",
          feature: "countries"
        }
      },
      mark: {
        type: "geoshape",
        fill: "#e6e6e6",
        stroke: "#ffffff",
        strokeWidth: 0.5
      }
    },
   
    {
      data: {
        url: "drivers.csv",
        format: { type: "csv" }
      },
      transform: [

        {
          aggregate: [],
          groupby: ["driverRef", "nationality"]
        },

        {
          aggregate: [{ op: "count", as: "driver_count" }],
          groupby: ["nationality"]
        },
        
        {
          lookup: "nationality",
          from: {
            data: {
              values: [
                { nationality: "British", country_name: "United Kingdom" },
                { nationality: "American", country_name: "United States" },
                { nationality: "Italian", country_name: "Italy" },
                { nationality: "French", country_name: "France" },
                { nationality: "German", country_name: "Germany" },
                { nationality: "Brazilian", country_name: "Brazil" },
                { nationality: "Argentine", country_name: "Argentina" },
                { nationality: "Belgian", country_name: "Belgium" },
                { nationality: "Swiss", country_name: "Switzerland" },
                { nationality: "South African", country_name: "South Africa" },
                { nationality: "Japanese", country_name: "Japan" },
                { nationality: "Australian", country_name: "Australia" },
                { nationality: "Dutch", country_name: "Netherlands" },
                { nationality: "Spanish", country_name: "Spain" },
                { nationality: "Austrian", country_name: "Austria" },
                { nationality: "Canadian", country_name: "Canada" },
                { nationality: "Swedish", country_name: "Sweden" },
                { nationality: "New Zealander", country_name: "New Zealand" },
                { nationality: "Finnish", country_name: "Finland" },
                { nationality: "Mexican", country_name: "Mexico" },
                { nationality: "Danish", country_name: "Denmark" },
                { nationality: "Irish", country_name: "Ireland" },
                { nationality: "Rhodesian", country_name: "Zimbabwe" }, 
                { nationality: "Portuguese", country_name: "Portugal" },
                { nationality: "Russian", country_name: "Russia" },
                { nationality: "Monegasque", country_name: "Monaco" },
                { nationality: "Uruguayan", country_name: "Uruguay" },
                { nationality: "Colombian", country_name: "Colombia" },
                { nationality: "Venezuelan", country_name: "Venezuela" },
                { nationality: "East German", country_name: "Germany" }, 
                { nationality: "Thai", country_name: "Thailand" },
                { nationality: "Indian", country_name: "India" },
                { nationality: "Indonesian", country_name: "Indonesia" },
                { nationality: "Chinese", country_name: "China" },
                { nationality: "Argentine-Italian", country_name: "Argentina" },
                { nationality: "Czech", country_name: "Czechia" },
                { nationality: "American-Italian", country_name: "United States" },
                { nationality: "Liechtensteiner", country_name: "Liechtenstein" },
                { nationality: "Chilean", country_name: "Chile" },
                { nationality: "Malaysian", country_name: "Malaysia" },
                { nationality: "Hungarian", country_name: "Hungary" },
                { nationality: "Polish", country_name: "Poland" },
                { nationality: "Argentinian ", country_name: "Argentina" } 
              ]
            },
            key: "nationality",
            fields: ["country_name"]
          }
        },
        { filter: "isValid(datum.country_name)" },

        {
          lookup: "country_name",
          from: {
            data: {
              url: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
              format: { type: "topojson", feature: "countries" }
            },
            key: "properties.name"
          },
          as: "geo"
        }
      ],
      mark: { type: "geoshape", stroke: "#ffffff", strokeWidth: 0.4 },
      encoding: {
        shape: { field: "geo", type: "geojson" },
        color: {
          field: "driver_count",
          type: "quantitative",
          title: "Total Unique Drivers",
          scale: { 
            scheme: "reds" 
          }
        },
        tooltip: [
          { field: "country_name", type: "nominal", title: "Country" },
          { field: "driver_count", type: "quantitative", title: "Unique Drivers", format: "," }
        ]
      }
    }
  ]
};

vegaEmbed("#driverMapChart", driverMapSpec);

//5. Legendary Drivers & Total Wins
const famousDriversWinsSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "All-time race victories for Formula 1 legends with custom icon telemetry markers colored by team livery.",
  width: 550,
  height: 450,
  background: "#f8f9fa",

  config: {
    autosize: { type: "fit", contains: "padding" }
  },

  data: {
    url: "driver_standings.csv",
    format: { type: "csv" }
  },

  transform: [
    {
      lookup: "raceId",
      from: {
        data: { 
          url: "races.csv", 
          format: { type: "csv" } 
        },
        key: "raceId",
        fields: ["year"]
      }
    },
    {
      aggregate: [{ op: "max", field: "wins", as: "yearly_max_wins" }],
      groupby: ["driverId", "year"]
    },
    {
      aggregate: [{ op: "sum", field: "yearly_max_wins", as: "total_career_wins" }],
      groupby: ["driverId"]
    },
    {
      lookup: "driverId",
      from: {
        data: { 
          url: "drivers.csv", 
          format: { type: "csv" } 
        },
        key: "driverId",
        fields: ["forename", "surname"]
      }
    },
    {
      calculate: "datum.forename + ' ' + datum.surname",
      as: "driver_name"
    },
    {
      calculate: 
        "datum.driver_name == 'Lewis Hamilton' ? 'Mercedes' : " +
        "datum.driver_name == 'Michael Schumacher' || datum.driver_name == 'Niki Lauda' ? 'Ferrari' : " +
        "datum.driver_name == 'Max Verstappen' || datum.driver_name == 'Sebastian Vettel' ? 'Red Bull' : " +
        "datum.driver_name == 'Alain Prost' || datum.driver_name == 'Ayrton Senna' ? 'McLaren' : " +
        "datum.driver_name == 'Fernando Alonso' ? 'Renault' : " +
        "datum.driver_name == 'Nigel Mansell' ? 'Williams' : 'Other Historic Teams'",
      as: "iconic_constructor"
    },
    { filter: "datum.total_career_wins >= 25" }
  ],

  layer: [
    {
      mark: { type: "rule", color: "#d1d5db", strokeWidth: 2.5 },
      encoding: {
        x: {
          field: "total_career_wins",
          type: "quantitative",
          title: "Total Career Victories"
        },
        y: {
          field: "driver_name",
          type: "nominal",
          title: "Driver",
          sort: "-x"
        }
      }
    },
    {
      mark: {
        type: "point",
        filled: true,
        size: 80, 
        shape: "M -2,-3 L 2,-3 L 2,-1 C 2,1 -2,1 -2,-1 Z M -3,-2 L -2,-2 L -2,-1 L -3,-1 Z M 2,-2 L 3,-2 L 3,-1 L 2,-1 Z M -0.5,0 L 0.5,0 L 0.5,2 L -0.5,2 Z M -2,2 L 2,2 L 2,3 L -2,3 Z"
      },
      encoding: {
        x: { field: "total_career_wins", type: "quantitative" },
        y: { field: "driver_name", type: "nominal", sort: "-x" },
        color: {
          field: "iconic_constructor",
          type: "nominal",
          scale: {
            domain: ["Ferrari", "McLaren", "Mercedes", "Red Bull", "Renault", "Williams", "Other Historic Teams"],
            range: ["#dc0000", "#ff8700", "#00d2be", "#0600ef", "#ffda03", "#005aff", "#6b7280"]
          },
          
          legend: {
            title: "Constructor Team",
            orient: "bottom",       
            columns: 3,             
            symbolSize: 30,        
            labelFontSize: 10,      
            titleFontSize: 11,
            offset: 15             
          }
        },
        tooltip: [
          { field: "driver_name", type: "nominal", title: "Driver" },
          { field: "iconic_constructor", type: "nominal", title: "Iconic Team" },
          { field: "total_career_wins", type: "quantitative", title: "Career Wins", format: "," }
        ]
      }
    }, 
    {
      mark: { 
        type: "text", 
        align: "left", 
        dx: 15, 
        fontSize: 11, 
        fontWeight: "bold", 
        color: "#374151" 
      },
      encoding: {
        x: { field: "total_career_wins", type: "quantitative" },
        y: { field: "driver_name", type: "nominal", sort: "-x" },
        text: { field: "total_career_wins", type: "quantitative" }
      }
    }
  ]
};

vegaEmbed("#driverWinsChart", famousDriversWinsSpec);

//8. qualifying vs race bar chart 
const poleConversionSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Pole position to win conversion rate for 11 legendary F1 drivers with labels.",
  width: 500,
  height: 450,
  background: "#f8f9fa",
  
  config: {
    autosize: { type: "fit", contains: "padding" }
  },

  data: {
    url: "results.csv",
    format: { type: "csv" }
  },

  transform: [
    { filter: "datum.grid == 1" },
    {
      lookup: "driverId",
      from: {
        data: { url: "drivers.csv", format: { type: "csv" } },
        key: "driverId",
        fields: ["forename", "surname"]
      }
    },
    { calculate: "datum.forename + ' ' + datum.surname", as: "driver_name" },
    { 
      filter: "indexof(['Lewis Hamilton', 'Michael Schumacher', 'Alain Prost', 'Sebastian Vettel', 'Max Verstappen', 'Ayrton Senna', 'Fernando Alonso', 'Nigel Mansell', 'Jackie Stewart', 'Niki Lauda', 'Jim Clark'], datum.driver_name) >= 0" 
    },
    { calculate: "datum.positionOrder == 1 ? 1 : 0", as: "won_from_pole" },
    {
      aggregate: [
        { op: "count", as: "total_poles" },
        { op: "sum", field: "won_from_pole", as: "pole_wins" }
      ],
      groupby: ["driver_name"]
    },
    { calculate: "(datum.pole_wins / datum.total_poles) * 100", as: "conversion_rate" },
    {
      calculate: 
        "datum.driver_name == 'Lewis Hamilton' ? 'Mercedes' : " +
        "datum.driver_name == 'Michael Schumacher' || datum.driver_name == 'Niki Lauda' ? 'Ferrari' : " +
        "datum.driver_name == 'Max Verstappen' || datum.driver_name == 'Sebastian Vettel' ? 'Red Bull' : " +
        "datum.driver_name == 'Alain Prost' || datum.driver_name == 'Ayrton Senna' ? 'McLaren' : " +
        "datum.driver_name == 'Fernando Alonso' ? 'Renault' : " +
        "datum.driver_name == 'Nigel Mansell' ? 'Williams' : 'Other Teams'",
      as: "iconic_constructor"
    }
  ],

  layer: [
    {
      mark: { type: "bar", cornerRadiusEnd: 4 },
      encoding: {
        x: { field: "conversion_rate", type: "quantitative", title: "Conversion Rate (%)", scale: { domain: [0, 100] } },
        y: { field: "driver_name", type: "nominal", title: "Driver", sort: "-x" },
        color: {
          field: "iconic_constructor",
          type: "nominal",
          title: "Iconic Team Livery",
          scale: {
            domain: ["Ferrari", "McLaren", "Mercedes", "Red Bull", "Renault", "Williams", "Other Teams"],
            range: ["#dc0000", "#ff8700", "#00d2be", "#0600ef", "#ffda03", "#005aff", "#6b7280"]
          },
          legend: { orient: "bottom", columns: 4, labelFontSize: 10, titleFontSize: 11, offset: 15 }
        }
      }
    },
    
    {
      mark: { type: "text", align: "left", dx: 5, fontSize: 11, fontWeight: "bold", color: "#374151" },
      encoding: {
        x: { field: "conversion_rate", type: "quantitative" },
        y: { field: "driver_name", type: "nominal", sort: "-x" },
        text: { field: "conversion_rate", type: "quantitative", format: ".1f" }
      }
    }
  ],
  
  tooltip: [
    { field: "driver_name", type: "nominal", title: "Driver" },
    { field: "iconic_constructor", type: "nominal", title: "Iconic Team" },
    { field: "total_poles", type: "quantitative", title: "Total Career Poles" },
    { field: "pole_wins", type: "quantitative", title: "Wins from Pole" },
    { field: "conversion_rate", type: "quantitative", title: "Conversion Rate", format: ".1f" }
  ]
};

vegaEmbed("#qualifyingVsRaceChart", poleConversionSpec);

//8.Total Cumulative Pit Stops by Race Lap Number for Contemporary F1 legends (2011-2024)
const pitStopStreamSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "A streamgraph showing the real-time rhythm and volume of pit stops across a Grand Prix distance.",
  width: 500,
  height: 450,
  background: "#f8f9fa",

  params: [{
    name: "driver_filter",
    select: { type: "point", fields: ["driver_name"] },
    bind: "legend"
  }],

  config: {
    autosize: { type: "fit", contains: "padding" }
  },

  data: {
    url: "pit_stops.csv",
    format: { type: "csv" }
  },

  transform: [
    {
      filter: "datum.driverId == 1 || datum.driverId == 4 || datum.driverId == 20 || datum.driverId == 30 || datum.driverId == 830"
    },
    {
      calculate: 
        "datum.driverId == 1 ? 'Lewis Hamilton' : " +
        "datum.driverId == 4 ? 'Fernando Alonso' : " +
        "datum.driverId == 20 ? 'Sebastian Vettel' : " +
        "datum.driverId == 30 ? 'Michael Schumacher' : 'Max Verstappen'",
      as: "driver_name"
    },
    { filter: "datum.lap <= 70" }
  ],

  mark: { type: "area", interpolate: "monotone" },

  encoding: {
    x: {
      field: "lap",
      type: "quantitative",
      title: "Race Lap Number",
      scale: { domain: [1, 70] },
      axis: { grid: false, tickMinStep: 5 }
    },
    y: {
      aggregate: "count",
      axis: null,
      stack: "center"
    },
    color: {
      field: "driver_name",
      type: "nominal",
      title: "Driver (Click to Filter)", 
      scale: {
        domain: ["Lewis Hamilton", "Max Verstappen", "Sebastian Vettel", "Fernando Alonso", "Michael Schumacher"],
        range: ["#00d2be", "#0600ef", "#004225", "#ffda03", "#dc0000"]
      },
      legend: {
        orient: "bottom",
        columns: 3,
        labelFontSize: 10,
        titleFontSize: 11,
        offset: 15
      }
    },

    opacity: {
      condition: { param: "driver_filter", value: 0.9 },
      value: 0.1
    },
    tooltip: [
      { field: "driver_name", type: "nominal", title: "Driver" },
      { field: "lap", type: "quantitative", title: "Race Lap" },
      { aggregate: "count", type: "quantitative", title: "Total Stops on this Lap" }
    ]
  }
};

vegaEmbed("#pitStopStreamChart", pitStopStreamSpec);

//9. F1 Fatal Accidents Historical Dot Plot
const safetyTimelineSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 320,
  height: 380,
  background: "#f8f9fa",

  params: [{
    name: "session_filter",
    select: { type: "point", fields: ["Session"] },
    bind: "legend" // Links the filter behavior to the color legend
  }],

  data: {
    url: "fatal_accidents_drivers.csv",
    format: { type: "csv" }
  },

  transform: [
    { calculate: "split(datum['Date Of Accident'], '/')", as: "date_parts" },
    { calculate: "parseInt(datum.date_parts[2])", as: "raw_yr" },
    { 
      calculate: "datum.raw_yr > 25 ? 1900 + datum.raw_yr : 2000 + datum.raw_yr", 
      as: "cal_year" 
    },
    { calculate: "datum.Event == 'N/A' || !isValid(datum.Event) ? 'Private Track Test' : datum.Event", as: "cleaned_event" },
    { calculate: "substring(datum.cleaned_event, 5)", as: "track_location" },
    { calculate: "datum.track_location == '' ? datum.cleaned_event : datum.track_location", as: "final_track" }
  ],

  mark: { type: "circle", size: 100, opacity: 0.8, stroke: "#ffffff", strokeWidth: 1 },
  
  encoding: {
    x: {
      field: "cal_year",
      type: "quantitative",
      title: "Year of Accident",
      scale: { domain: [1950, 2020] },
      axis: { format: "d", grid: true }
    },
    y: {
      field: "final_track",
      type: "nominal",
      title: "Circuit / Event Location",
      sort: "x"
    },
    color: {
      field: "Session",
      type: "nominal",
      title: "Session Type (Click to Filter)",
      scale: {
        domain: ["Race", "Qualifying", "Practice", "Test", "Pre-race test"],
        range: ["#dc0000", "#ff8700", "#000000", "#005aff", "#6b7280"] 
      },
      legend: {
        orient: "bottom",
        columns: 3,
        offset: 15
      }
    },

    opacity: {
      condition: { param: "session_filter", value: 0.8 },
      value: 0.1
    },
    tooltip: [
      { field: "Driver", type: "nominal", title: "Driver" },
      { field: "cal_year", type: "quantitative", title: "Year" },
      { field: "cleaned_event", type: "nominal", title: "Event" },
      { field: "Car", type: "nominal", title: "Constructor/Car" },
      { field: "Session", type: "nominal", title: "Session" }
    ]
  }
};

vegaEmbed("#fatalDotPlot", safetyTimelineSpec);

//11. Driver Ages in Fatal Accidents 
const ageDistributionSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Histogram showing the distribution of driver ages in fatal accidents.",
  width: 450,
  height: 400,
  background: "#f8f9fa",

  data: {
    url: "fatal_accidents_drivers.csv",
    format: { type: "csv" }
  },
  transform: [
    { filter: "isValid(datum.Age)" }
  ],
  mark: { type: "bar", stroke: null},
  encoding: {
    x: {
      field: "Age",
      type: "quantitative",
      bin: { step: 5 },
      title: "Driver Age at Time of Accident"
    },
    y: {
      aggregate: "count",
      title: "Number of Fatal Accidents"
    },
    color: {
      field: "Age",
      type: "quantitative",
      bin: { step: 5 },
      scale: { scheme: "reds" },
      legend: null
    },

    tooltip: [
      { field: "Age", type: "quantitative", bin: "binned", title: "Age Range" },
      { aggregate: "count", title: "Accident Count" }
    ]
  }
};
vegaEmbed("#ageAccidentChart", ageDistributionSpec);

//12. Constructor Wins in Australian Grand Prix 
const interactiveDonutSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "Donut chart with interactive legend and slice selection.",
  width: 400,
  height: 300,
  background: "#f8f9fa",

  data: {
    url: "aus_wins_by_team.csv"
  },

  params: [
    {
      name: "highlight",
      select: { type: "point", fields: ["display_name"] } 
    }
  ],

  transform: [
    {
      calculate: "indexof(['Ferrari', 'McLaren', 'Red Bull', 'Mercedes', 'Renault', 'Williams'], datum.name) > -1 ? datum.name : 'Other Teams'",
      as: "display_name"
    },
    {
      aggregate: [{ op: "sum", field: "wins", as: "total_wins" }],
      groupby: ["display_name"]
    }
  ],

  mark: { 
    type: "arc", 
    innerRadius: 60, 
    stroke: "#ffffff", 
    strokeWidth: 2,
    cursor: "pointer" 
  },

  encoding: {
    theta: { 
      field: "total_wins", 
      type: "quantitative", 
      stack: true 
    },
    color: { 
          field: "display_name", 
          type: "nominal",
          title: "Constructor",
          
          scale: {
            domain: ["Ferrari", "McLaren", "Red Bull", "Mercedes", "Renault", "Williams", "Other Teams"],
            range: ["#dc0000", "#ff8700", "#0600ef", "#00d2be", "#ffda03", "#005aff", "#6b7280"]
          },
          
          condition: {
            param: "highlight",
            field: "display_name",
            type: "nominal"
          },
          value: "#d3d3d3" 
        },
    opacity: {
      condition: { param: "highlight", value: 1 },
      value: 0.2 
    },
    tooltip: [
      { field: "display_name", type: "nominal", title: "Constructor" },
      { field: "total_wins", type: "quantitative", title: "Total Wins" }
    ]
  }
};

vegaEmbed("#donutChart", interactiveDonutSpec);