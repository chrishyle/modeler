(function () {
    // Variables to all functions
    var request = superagent,
        sourceList = document.getElementById('sourceList'),
        graphElement = document.getElementById('graph'),
        dataSelector = document.getElementById('dataSelector'),
        graph = new joint.dia.Graph(),
        paper = new joint.dia.Paper({
            el: graphElement,
            gridSize: 10,
            model: graph
        }),
        models = {},
        positionMap;

    // Startup actions
    resetGraph();
    resizeGraph();
    getData();

    /***** dataSelector *****/

    dataSelector.addEventListener('change', function () {
        console.log('change');
        resetGraph();
        getData();
    });

    function resetGraph(){
        positionMap = localStorage.getItem('positionMap-'+dataSelector.value);
        if (positionMap) positionMap = JSON.parse(positionMap);

        graph.clear();

        for (var i = sourceList.children.length; i >= 0; i--) {
            var child = sourceList.children[i];
            if (child && (child.tagName === 'UL' || child.tagName === 'LI')) {
                sourceList.removeChild(child);
            }

        }

        if(!positionMap) {
            switch(dataSelector.value) {
                case 'person.json':
                    positionMap = {
                        person: { x: 250, y: 20 },
                        man: { x: 100, y: 280 },
                        woman: { x: 400, y: 280 },
                        item_purchased: { x: 600, y: 20 },
                        item: { x: 750, y: 280 }
                    };
                    break;
                case 'library.json':

                    positionMap = {
                        book: { x: 750, y: 350 },
                        bookshelf: { x: 680, y: 40 },
                        customer: { x: 390, y: 350 },
                        librarian: { x: 90, y: 350 },
                        branch: { x: 210, y: 40 }
                    };
                    break;
            }

            localStorage.setItem('positionMap-'+dataSelector.value, JSON.stringify(positionMap));
        }

    }

    // Functions
    function getData() {
        request.get('data/' + dataSelector.value, function (res) {
            var classes = JSON.parse(res.text.replace(/\/\/.*/g,''));
            generateClasses(classes);
            setupConnections();
        });
    }


    function generateClasses(classes) {
        var counter = 0,
            graphWidth = graphElement.getBoundingClientRect().width;

        for (var key in classes) {
            var fields = classes[key].fields;

            models[key] = createModel(key, fields, positionMap[key]);
            // { x: 20 + (counter *250), y: 20 }
            counter++;
        }
    }

    function createRelation(source, target, arrowDirection) {
        var link = new joint.dia.Link({
            source: { id: source },
            target: { id: target }
        });
        link.attr({
            '.connection': { stroke: 'black', 'stroke-width': 2 },
        });
        if (arrowDirection === 'target' || arrowDirection === 'both') {
            link.attr({
                '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
            });
        }
        if (arrowDirection === 'source'  || arrowDirection === 'both') {
            link.attr({
                '.marker-source': { d: 'M 10 0 L 0 5 L 10 10 z' }
            });
        }
        return link;
    }

    function setupConnections() {
        var link;
        if (dataSelector.value === 'person.json') {
            link = new joint.shapes.uml.Generalization({
                source: { id: models.man },
                target: { id: models.person }
            });
            graph.addCell(link);
            link = new joint.shapes.uml.Generalization({
                source: { id: models.woman },
                target: { id: models.person }
            });
            graph.addCell(link);
            graph.addCell(createRelation(models.person, models.item_purchased, 'target'));
            graph.addCell(createRelation(models.item_purchased, models.item, 'source'));

        }
        else {
            graph.addCell(createRelation(models.branch, models.bookshelf, 'target'));
            graph.addCell(createRelation(models.bookshelf, models.book, 'target'));
            graph.addCell(createRelation(models.branch, models.librarian, 'target'));
            graph.addCell(createRelation(models.branch, models.customer, 'both'));
            graph.addCell(createRelation(models.book, models.customer, 'both'));


            // link = new joint.dia.Link({
            //     source: { id: models.item_purchased },
            //     target: { id: models.item }
            // });
            // link.attr({
            //     // '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
            // });
            // graph.addCell(link);
        }

        // new uml.Generalization({ source: { id: models.woman }, target: { id: models.person.name }}),
    }

    /***** Event Handling *****/
    window.addEventListener('resize', resizeGraph);
    window.addEventListener('click', handleClick);
    window.addEventListener('dblclick', handleDoubleClick);

    function resizeGraph() {
        var rect = graphElement.getBoundingClientRect();
        paper.setDimensions(rect.width, rect.height);
    }

    function handleClick(event) {
        var target = event.target;

        if (target.classList.contains('has-children')) {
            target.classList.toggle('collapsed');
        }

        if (target.getAttribute('id') === 'newModel') {
            var newModel = createModel('Untitled', []);
            var view = paper.findViewByModel(newModel);
            var title = view.$el.children()[0].childNodes[1];
            beginEditing({ target: title }, 'name');
        }
    }

    function handleDoubleClick(event) {
        var target = event.target;
        if (target.childElementCount > 0) return;

        var parent = target.parentNode;

        if (target.classList.contains('uml-class-name-text') ||
            target.classList.contains('uml-class-attrs-text')) {
            var type = target.classList[0].match(/uml-class-(.*)-text/)[1];
            beginEditing(event, type);
        }
        else if (parent && parent.classList.contains('uml-class-attrs-text')) {
            beginEditing({ target: parent }, 'attrs', target.textContent);
        }
        else if (target.classList.contains('uml-class-attrs-rect')) {
            var attributesText = target.parentElement.parentElement.childNodes[2];
            var hasAttributes = attributesText.childElementCount;
            if (!hasAttributes) {
                beginEditing({ target: attributesText }, 'attrs');
            }
        }
    }

    /***** DOM helpers *****/

    function createModel(name, attributes, position) {
        var model = new joint.shapes.uml.Class({
            position: position,
            size: { width: 200, height: 200 }
        });

        var listItem = model.listItem = generateItem(name);
        // listItem.classList.add('collapsed');
        sourceList.appendChild(listItem);

        if (attributes) {
            listItem.classList.add('has-children');
            var listItemChildren = model.listItemChildren = generateItemChildren(generateAttributes(attributes));
            sourceList.appendChild(listItemChildren);
        }

        model.on('uml-update', function () {
            this.listItem.innerText = this.get('name');
            this.listItemChildren = generateItemChildren(this.get('attributes'), this.listItemChildren);
        });

        model.on('change:position', function (data) {
            positionMap[this.get('name')] = data.changed.position;
            localStorage.setItem('positionMap-'+dataSelector.value, JSON.stringify(positionMap));
        });

        // model.on('uml-update')
        model.set('name', name);
        model.set('attributes', generateAttributesWithTypes(attributes));


        graph.addCell(model);

        return model;
    }

    function generateItemChildren(attributes, listItem) {
        //TODO: attributes may not be "universal" for all levels
        var ul = listItem || document.createElement('ul');
        while (ul.hasChildNodes()) {
            ul.removeChild(ul.lastChild);
        }
        if (attributes) {
            for (var i = 0, len = attributes.length; i < len; i++) {
                ul.appendChild(generateItem(attributes[i]));
            }

            // for (var property in attributes) {
            //     ul.appendChild(generateItem(property));
            // }
        }

        return ul;
    }

    function generateItem(content) {
        var li = document.createElement('li');
        li.innerHTML = content;
        return li;
    }

    function generateAttributes(attributes) {
        return Object.keys(attributes);
    }

    function generateAttributesWithTypes(attributes) {
        var withTypes = [];
        for (var property in attributes) {
            withTypes.push(property + ' : ' + attributes[property].type);
        }
        return withTypes;
    }

    var modal,
        editingBox,
        editingTarget,
        previousValue;

    function beginEditing(event, type, value) {
        editingTarget = event.target;
        editingTarget._type = type;

        var rect = editingTarget.getBoundingClientRect();
        var parentRect = editingTarget.parentElement.getBoundingClientRect();

        if (!editingBox) {
            editingBox = document.createElement('input');
            editingBox.classList.add('editing-box');
            editingBox.addEventListener('keyup', function (keyEvt) {
                if (keyEvt.which === 13) { //ENTER
                    doneEditing();
                }
                if (keyEvt.which === 27) { // ESC
                    dismiss();
                }
            });
        }
        previousValue = value || editingTarget.textContent;
        editingBox.value = value || editingTarget.textContent;

        editingBox.style.top    = rect.top + 'px';
        editingBox.style.left   = parentRect.left + 'px';
        editingBox.style.width  = parentRect.width + 'px';
        editingBox.style.height = rect.height + 'px';

        // debugger;

        editingTarget.style.display = 'none';

        document.body.appendChild(editingBox);
        appendModal();

        editingBox.focus();
        editingBox.select();
    }

    function doneEditing(){
        var type = editingTarget._type;
        var model = paper.findView(editingTarget).model;
        if (type === 'attrs') {
            var attributes = model.get('attributes').slice(0);
            // previousValue
            attributes[attributes.indexOf(previousValue)] = editingBox.value.trim();
            model.set('attributes', attributes);
        }
        if (type === 'name') {
           model.set('name', editingBox.value.trim());
        }
        dismiss();
    }

    function dismiss(){
        document.body.removeChild(editingBox);
        document.body.removeChild(modal);
        editingTarget.style.display = 'block';
    }

    function appendModal(){
        if (!modal) {
            modal = document.createElement('div');
            modal.classList.add('modal');
        }

        modal.removeEventListener('click');
        modal.addEventListener('click', doneEditing);

        document.body.appendChild(modal);
    }

})();