(function () {
    // Variables to all functions
    var request = superagent,
        sourceList = document.getElementById('sourceList'),
        graphElement = document.getElementById('graph'),
        graph = new joint.dia.Graph(),
        paper = new joint.dia.Paper({
            el: graphElement,
            gridSize: 10,
            model: graph
        });

    // Startup actions
    resizeGraph();
    getData();

    // Event handlers
    window.addEventListener('resize', resizeGraph);
    window.addEventListener('click', handleClick);

    // Functions

    function resizeGraph() {
        var rect = graphElement.getBoundingClientRect();
        paper.setDimensions(rect.width, rect.height);
    }

    function getData() {
        request.get('data/level1-re.json', function (res) {
            var classes = JSON.parse(res.text.replace(/\/\/.*/g,''));
            generateSourceList(classes);
            generateUMLClasses(classes);
        });
    }

    function generateItem(content) {
        var li = document.createElement('li');
        li.innerHTML = content;
        return li;
    }

    function generateSourceList(classes) {
        for (var key in classes) {
            var item = generateItem(key);
            // item.classList.add('collapsed');
            sourceList.appendChild(item);

            var fields = classes[key].fields;
            //TODO: fields may not be "universal" for all levels
            if (fields) {
                item.classList.add('has-children');
                var ul = document.createElement('ul');
                sourceList.appendChild(ul);
                for (var property in fields) {
                    ul.appendChild(generateItem(property));

                }
            }
        }
    }

    function generateUMLClasses(classes) {
        var counter = 0,
            graphWidth = graphElement.getBoundingClientRect().width;

        for (var key in classes) {
            var fields = classes[key].fields,
                fieldStrings = [];

            for (var field in fields){
                fieldStrings.push(field + ': ' + fields[field].type);
            }

            var umlClass = new joint.shapes.uml.Class({
                position: { x: 20 + (counter *250), y: 20 },
                size: { width: 200, height: 200 },
                name: key,
                attributes: fieldStrings

            });
            graph.addCell(umlClass);
            counter++;
        }
    }

    // function setupConnections() {
    //     var relations = [
    //         new uml.Generalization({ source: { id: classes.man }, target: { id: classes.person.name }}),
    //         new uml.Generalization({ source: { id: classes.woman }, target: { id: classes.person.name }}),
    //     ];

    //     _.each(relations, function(r) { graph.addCell(r); });
    // }

    function handleClick(event) {
        var target = event.target;

        if (target.classList.contains('has-children')) {
            target.classList.toggle('collapsed');
        }
    }

})();