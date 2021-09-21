```javascript
const UNITS = [
        {
            name: "count",
            unit: "",
            conversions: [
                {
                    unit: "",
                    factor: 1
                },
                {
                    unit: "k",
                    factor: 0.001
                },
                {
                    unit: "mil",
                    factor: 0.000001
                },
                {
                    unit: "bil",
                    factor: 0.000000001
                }
            ]
        },
        {
            name: "thousands",
            unit: "k",
            conversions: [
                {
                    unit: "",
                    factor: 1000
                },
                {
                    unit: "k",
                    factor: 1
                },
                {
                    unit: "mil",
                    factor: 0.001
                },
                {
                    unit: "bil",
                    factor: 0.000001
                }
            ]
        },
        {
            name: "millions",
            unit: "mil",
            conversions: [
                {
                    unit: "",
                    factor: 1000000
                },
                {
                    unit: "k",
                    factor: 1000
                },
                {
                    unit: "mil",
                    factor: 1
                },
                {
                    unit: "bil",
                    factor: 0.001
                }
            ]
        },
        {
            name: "billions",
            unit: "bil",
            conversions: [
                {
                    unit: "",
                    factor: 1000000000
                },
                {
                    unit: "k",
                    factor: 1000000
                },
                {
                    unit: "mil",
                    factor: 1000
                },
                {
                    unit: "bil",
                    factor: 1
                },
            ]
        },

        //Memory/Disk
        {
            name: "bytes",
            unit: "B",
            conversions: [
                {
                    unit: "B",
                    factor: 1
                },
                {
                    unit: "kB",
                    factor: 0.001
                },
                {
                    unit: "MB",
                    factor: 0.000001
                },
                {
                    unit: "GB",
                    factor: 0.000000001
                }
            ]
        },
        {
            name: "kilobytes",
            unit: "kB",
            conversions: [
                {
                    unit: "B",
                    factor: 1000
                },
                {
                    unit: "kB",
                    factor: 1
                },
                {
                    unit: "MB",
                    factor: 0.001
                },
                {
                    unit: "GB",
                    factor: 0.000001
                }
            ]
        },
        {
            name: "megabytes",
            unit: "MB",
            conversions: [
                {
                    unit: "B",
                    factor: 1000000
                },
                {
                    unit: "kB",
                    factor: 1000
                },
                {
                    unit: "MB",
                    factor: 1
                },
                {
                    unit: "GB",
                    factor: 0.001
                }
            ]
        },
        {
            name: "gigabytes",
            unit: "GB",
            conversions: [
                {
                    unit: "B",
                    factor: 1000000000
                },
                {
                    unit: "kB",
                    factor: 1000000
                },
                {
                    unit: "MB",
                    factor: 1000
                },
                {
                    unit: "GB",
                    factor: 1
                },
            ]
        },

        //Rates
        {
            name: "bytes per second",
            unit: "B/s",
            conversions: [
                {
                    unit: "B/s",
                    factor: 1
                },
                {
                    unit: "kB/s",
                    factor: 0.001
                },
                {
                    unit: "MB/s",
                    factor: 0.000001
                },
                {
                    unit: "GB/s",
                    factor: 0.000000001
                }
            ]
        },
        {
            name: "kilobytes per second",
            unit: "kB/s",
            conversions: [
                {
                    unit: "B/s",
                    factor: 1000
                },
                {
                    unit: "kB/s",
                    factor: 1
                },
                {
                    unit: "MB/s",
                    factor: 0.001
                },
                {
                    unit: "GB/s",
                    factor: 0.000001
                }
            ]
        },
        {
            name: "megabytes per second",
            unit: "MB/s",
            conversions: [
                {
                    unit: "B/s",
                    factor: 1000000
                },
                {
                    unit: "kB/s",
                    factor: 1000
                },
                {
                    unit: "MB/s",
                    factor: 1
                },
                {
                    unit: "GB/s",
                    factor: 0.001
                }
            ]
        },
        {
            name: "gigabytes per second",
            unit: "GB/s",
            conversions: [
                {
                    unit: "B/s",
                    factor: 1000000000
                },
                {
                    unit: "kB/s",
                    factor: 1000000
                },
                {
                    unit: "MB/s",
                    factor: 1000
                },
                {
                    unit: "GB/s",
                    factor: 1
                },
            ]
        },

        ////////TIME
        {
            name: "nanoseconds",
            unit: "ns",
            conversions: [
                {
                    unit: "ns",
                    factor: 1
                },
                {
                    unit: "µs",
                    factor: 1e-3
                },
                {
                    unit: "ms",
                    factor: 1e-6
                },
                {
                    unit: "s",
                    factor: 1e-9
                },
                {
                    unit: "mins",
                    factor: 1e-9 / 60
                },
                {
                    unit: "hs",
                    factor: 1e-9 / 60 / 60
                }
            ]
        },
        {
            name: "microseconds",
            unit: "µs",
            conversions: [
                {
                    unit: "ns",
                    factor: 1e3
                },
                {
                    unit: "µs",
                    factor: 1
                },
                {
                    unit: "ms",
                    factor: 1e-3
                },
                {
                    unit: "s",
                    factor: 1e-6
                },
                {
                    unit: "mins",
                    factor: 1e-6 / 60
                },
                {
                    unit: "hs",
                    factor: 1e-6 / 60 / 60
                }
            ]
        },
        {
            name: "milliseconds",
            unit: "ms",
            conversions: [
                {
                    unit: "ns",
                    factor: 1e6
                },
                {
                    unit: "µs",
                    factor: 1e3
                },
                {
                    unit: "ms",
                    factor: 1
                },
                {
                    unit: "s",
                    factor: 1e-3
                },
                {
                    unit: "mins",
                    factor: 1e-3 / 60
                },
                {
                    unit: "hs",
                    factor: 1e-3 / 60 / 60
                }
            ]
        },
        {
            name: "seconds",
            unit: "s",
            conversions: [
                {
                    unit: "ns",
                    factor: 1e9
                },
                {
                    unit: "µs",
                    factor: 1e6
                },
                {
                    unit: "ms",
                    factor: 1e3
                },
                {
                    unit: "s",
                    factor: 1
                },
                {
                    unit: "mins",
                    factor: 1 / 60
                },
                {
                    unit: "hs",
                    factor: 1 / 60 / 60
                }
            ]
        },
        {
            name: "minutes",
            unit: "mins",
            conversions: [
                {
                    unit: "ns",
                    factor: 1e9 * 60
                },
                {
                    unit: "µs",
                    factor: 1e6 * 60
                },
                {
                    unit: "ms",
                    factor: 1e3 * 60
                },
                {
                    unit: "s",
                    factor: 1 * 60
                },
                {
                    unit: "mins",
                    factor: 1
                },
                {
                    unit: "hs",
                    factor: 1 / 60
                }
            ]
        },
        {
            name: "hours",
            unit: "hs",
            conversions: [
                {
                    unit: "ns",
                    factor: 1e9 * 60 * 60
                },
                {
                    unit: "µs",
                    factor: 1e6 * 60 * 60
                },
                {
                    unit: "ms",
                    factor: 1e3 * 60 * 60
                },
                {
                    unit: "s",
                    factor: 1 * 60 * 60
                },
                {
                    unit: "mins",
                    factor: 1 * 60
                },
                {
                    unit: "hs",
                    factor: 1
                }
            ]
        },
    ]
    ```