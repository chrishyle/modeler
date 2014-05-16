Modeler.io
==========

[http://modeler.io/](http://modeler.io/)

A Web based visualization for models.

![Demo](chrishyle.github.com/modeler/img/screenshot.png)

This web app is designed to display model data served as JSON from a server.
The JSON format describes the model and its attributes, along with attribute
types and relationship information.

The visualization displays a source list on the left side. The list has models
at the root level that can be disclosed to hide or show their attributes. There
is a `+ New Model` button that allows the user to create new models.

The main window is a canvas with a UML representation of the models. The models
can be rearranged freely in the window. Relationships are shown using solid
arrows, and inheritance is shown with open arrows.

Double clicking on a model name allows the user to rename the model. Double
clicking on an attribute allows the user to change the name or type of the
attribute.


### Roadmap

* Save changes back to the server
* Add ability to create relationships from the UI
* Add ability to add new attributes from the UI

