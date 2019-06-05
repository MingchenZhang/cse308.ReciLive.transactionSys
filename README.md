# cse308.ReciLive.transactionSys
Transaction system of Recilive

## What is Recilive
Recilive is a platform providing online classroom to teachers, teaching assistants and students.
The platform supports bidirectional audio, slice, drawing, and text discussion for attendee.
All interaction are synced on all clients, and saved on the cloud that is made available for later view.
Purely web based, no local clients are required.

## Technical detail
### Playback history consensus
Since all attendee can interact with the system, a total order of interaction has to avoid divergent behavior among clients.
All interactions, such as messages are packaged in packet called transaction.
Each transaction is given a number labeling their order by transaction system.
Transaction system in this repository forward transactions to all clients, with assigned transactions number.
conflict transactions are discarded, forcing client to resend.
This simple agreement protocol is made into a framework, which supports audio, image, drawing and text modules to provide interactive online classroom.
