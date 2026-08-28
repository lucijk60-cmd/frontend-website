# PPFStudio Review Workflow

Visitor reviews are written to the database immediately with `pending` status. The public review count and list intentionally include approved reviews only, so a newly submitted review will not appear publicly until an owner/admin approves it from the moderation panel. This is an authenticity safeguard; it is not a failed save.

After a successful submission, the public review query and admin pending query are invalidated, and the visitor sees a bilingual saved-and-pending acknowledgement. The server-side contract also keeps pending rows out of the public collection.

The current automated validation covers the review router contract, public approved/pending filtering, bilingual review text selection, and saved/pending feedback. A real browser submission through the protected owner/admin session should still be smoke-tested by the site owner because private credentials are not handled or stored by the assistant.
