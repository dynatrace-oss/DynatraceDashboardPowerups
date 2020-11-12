# Dynatrace OpenKit - JavaScript Reference Implementation

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## What is the OpenKit?

The OpenKit provides an easy and lightweight way to get insights into applications with Dynatrace/AppMon by instrumenting the source code of those applications.

It is best suited for applications running separated from their backend and communicating via HTTP, like rich-client-applications, embedded devices, terminals, and so on.

The big advantages of the OpenKit are that it's designed to
* be as easy-to-use as possible
* be as dependency-free as possible (no third party libraries or Dynatrace/AppMon Agent needed)
* be easily portable to other languages and platforms

This repository contains the reference implementation in pure TypeScript. Other implementations are listed as follows:
* .NET: https://github.com/Dynatrace/openkit-dotnet/
* Java: https://github.com/Dynatrace/openkit-java/
* C/C++: https://github.com/Dynatrace/openkit-native/

## What you can do with the OpenKit-JavaScript
* Create Sessions and User Actions
* Identify users on sessions
* Report values on actions
* Use it together with Dynatrace
* Trace web requests to server-side PurePaths

## What you cannot do with the OpenKit
* Create server-side PurePaths (this functionality is provided by [OneAgent SDKs](https://github.com/Dynatrace/OneAgent-SDK))
* Create metrics (use the [Custom network devices & metrics API](https://www.dynatrace.com/support/help/dynatrace-api/timeseries/what-does-the-custom-network-devices-and-metrics-api-provide/) to report metrics)

## Design Principles
* API should be as simple and easy-to-understand as possible
* Incorrect usage of the OpenKit should still lead to valid results, if possible
* Design reentrant APIs and document them

## Runtime requirements

### Promises

Promises are required for OpenKit to work at all. If your environment does not support them, they can be
polyfilled using a polyfill library.

### Communication library

If you use a platform without XMLHttpRequests and not node.js (http-module), you have to either polyfill
the XMLHttpRequest, or provide your own CommunicationChannel implementation, which can use the protocol
you want (e.g. MQTT).

## Obtaining OpenKit from npm

OpenKit is available on [npm](https://www.npmjs.com/package/@dynatrace/openkit-js) and should be used via npm or yarn.

For browsers a mirroring service like [jsDelivr](https://www.jsdelivr.com/package/npm/@dynatrace/openkit-js) can be used.
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@dynatrace/openkit-js@1.0.0/dist/browser/openkit.js"></script>
```

## Development

See [development.md](development.md).

## General Concepts

In this part the concepts used throughout OpenKit are explained. A short sample how to use OpenKit is
also provided. For detailed code samples have a look into [example.md](example.md) and the code documentation.

### OpenKitBuilder

An `OpenKitBuilder` instance is responsible for getting and setting application relevant information, e.g.
the application's version and device specific information.

### OpenKit

The `OpenKit` is responsible for creating user sessions (see `Session`).

Although it would be possible to have multiple `OpenKit` instances connected to the same endpoint
within one process, there should be one unique instance.

### Session

A `Session` represents kind of a user session, similar to a browser session in a web application.
However the application developer is free to choose how to treat a `Session`.  
The `Session` is used to create `Action` instances, report application crashes, identify users and 
to trace web requests when there is no `Action` available. 

When a `Session` is no longer required, it's highly recommended to end it, using the `Session.end()` method.

### Action

The `Action` are named hierarchical nodes for timing and attaching further details.
An `Action` is created from the `Session`. Actions provide the possibility to attach key-value pairs, 
named events and errors, and can be used for tracing web requests.

### WebRequestTracer

When the application developer wants to trace a web request, which is served by a service 
instrumented by Dynatrace, a `WebRequestTracer` should be used, which can be
requested from an `Action` and `Session`.

### Named Events

A named `Event` is attached to an `Action` and contains a name.

### Key-Value Pairs

For an `Action` key-value pairs can also be reported. The key is always a String
and the value may be a `number` or a `string`. All reported numbers are handled as floating point
values by Dynatrace.

### Errors & Crashes

Errors are a way to report an erroneous condition on an `Action`.  
Crashes are used to report (unhandled) exceptions on a `Session`.

### Identify Users

OpenKit enables you to tag sessions with unique user tags. The user tag is a String 
that allows to uniquely identify a single user.

## Example

This small example provides a rough overview how OpenKit can be used.
Detailed explanation is available in [example.md](example.md).

```javascript
const applicationName = "My OpenKit application";
const applicationID = "application-id";
const deviceID = 42;
const endpointURL = "https://tenantid.beaconurl.com/mbeacon";

const openKit = new OpenKitBuilder(endpointURL, applicationID, deviceID)
    .withApplicationName(applicationName)
    .withApplicationVersion("1.0.0.0")
    .withOperatingSystem("Windows 10")
    .withManufacturer("MyCompany")
    .withModelId("MyModelId")
    .build();

const clientIP = "8.8.8.8";
const session = openKit.createSession(clientIP);

session.identifyUser("jane.doe@example.com");

const actionName = "rootActionName";
const action = session.enterAction(actionName);

action.leaveAction();
session.end();
openKit.shutdown();
```
