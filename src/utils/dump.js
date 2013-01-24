/*
    Copyright 2008-2013
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.
    
    You can redistribute it and/or modify it under the terms of the
    
      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT
    
    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.
    
    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <http://www.gnu.org/licenses/>
    and <http://opensource.org/licenses/MIT/>.
 */


/*global JXG: true */
/*jslint nomen: true, plusplus: true*/

/* depends:
 JXG
 */

/**
 * @fileoverview The JXG.Dump namespace provides methods to save a board to javascript.
 */

(function () {

    "use strict";

    /**
     * The JXG.Dump namespace provides classes and methods to save a board to javascript.
     * @namespace
     */
    JXG.Dump = {

        /**
         * Adds markers to every element of the board
         * @param {JXG.Board} board
         * @param {Array|String} markers
         * @param {Array|%} values
         */
        addMarkers: function (board, markers, values) {
            var e, l, i;

            if (!JXG.isArray(markers)) {
                markers = [markers];
            }

            if (!JXG.isArray(values)) {
                values = [values];
            }

            l = Math.min(markers.length, values.length);

            markers.length = l;
            values.length = l;

            for (e in board.objects) {
                if (board.objects.hasOwnProperty(e)) {
                    for (i = 0; i < l; i++) {
                        board.objects[e][markers[i]] = values[i];
                    }
                }
            }
        },

        /**
         * Removes markers from every element on the board.
         * @param {JXG.Board} board
         * @param {Array|String} markers
         */
        deleteMarkers: function (board, markers) {
            var e, l, i;

            if (!JXG.isArray(markers)) {
                markers = [markers];
            }

            l = markers.length;

            markers.length = l;

            for (e in board.objects) {
                if (board.objects.hasOwnProperty(e)) {
                    for (i = 0; i < l; i++) {
                        delete board.objects[e][markers[i]];
                    }
                }
            }
        },

        /**
         * Stringifies a string, i.e. puts some quotation marks around <tt>s</tt> if it is of type string.
         * @param {%} s
         * @returns {String} " + s + "
         */
        str: function (s) {
            if (typeof s === 'string' && s.substr(0, 7) !== 'function') {
                s = '\'' + s + '\'';
            }

            return s;
        },

        /**
         * Eliminate default values given by {@link JXG.Options} from the attributes object.
         * @param {Object} instance Attribute object of the element
         * @param {Object} s Arbitrary number of objects <tt>instance</tt> will be compared to. Usually these are
         * sub-objects of the {@link JXG.Board#options} structure.
         * @returns {Object} Minimal attributes object
         */
        minimizeObject: function (instance, s) {
            var p, pl, copy = JXG.deepCopy(instance),
                defaults = [], i;

            for (i = 1; i < arguments.length; i++) {
                defaults.push(arguments[i]);
            }

            for (i = 0; i < defaults.length; i++) {
                for (p in defaults[i]) {
                    if (defaults[i].hasOwnProperty(p)) {
                        pl = p.toLowerCase();

                        if (typeof defaults[i][p] !== 'object' && defaults[i][p] === copy[pl]) {
                            delete copy[pl];
                        }
                    }
                }
            }

            return copy;
        },

        /**
         * Prepare the attributes object for an element.
         * @param {JXG.Board} board
         * @param {JXG.GeometryElement} obj Geometry element which attributes object is generated
         * @returns {Object} An attributes object.
         */
        prepareAttributes: function (board, obj) {
            var a, s;

            a = this.minimizeObject(obj.getAttributes(), board.options[obj.elType], board.options.elements);

            for (s in obj.subs) {
                if (obj.subs.hasOwnProperty(s)) {
                    a[s] = this.minimizeObject(obj.subs[s].getAttributes(), board.options[obj.elType][s], board.options[obj.subs[s].elType], board.options.elements);
                    a[s].id = obj.subs[s].id;
                    a[s].name = obj.subs[s].name;
                }
            }

            a.id = obj.id;
            a.name = obj.name;

            return a;
        },

        /**
         * Generate a save-able structure with all elements. This is used by {@link JXG.Dump#toJessie} and {@link JXG.Dump#toJavaScript}
         * to generate the script.
         * @param {JXG.Board} board
         * @returns {Array} An array with all metadata necessary to save the construction.
         */
        dump: function (board) {
            var e, obj, element, s,
                elementList = [], len = board.objectsList.length;

            this.addMarkers(board, 'dumped', false);

            for (e = 0; e < len; e++) {
                obj = board.objectsList[e];
                element = {};

                if (!obj.dumped && obj.dump) {
                    element.type = obj.getType();
                    element.parents = obj.getParents();

                    if (element.type === 'point' && element.parents[0] === 1) {
                        element.parents = element.parents.slice(1);
                    }

                    for (s = 0; s < element.parents.length; s++) {
                        if (typeof element.parents[s] === 'string') {
                            element.parents[s] = '\'' + element.parents[s] + '\'';
                        }
                    }

                    element.attributes = this.prepareAttributes(board, obj);

                    elementList.push(element);
                }
            }

            this.deleteMarkers(board, 'dumped');

            return elementList;
        },

        /**
         * Converts a JavaScript object into a JSAN (JessieScript Attribute Notation) string.
         * @param {Object} obj A JavaScript object, functions will be ignored.
         * @returns {String} The given object stored in a JSAN string.
         */
        toJSAN: function (obj) {
            var s, i, list, prop;

            switch (typeof obj) {
            case 'object':
                if (obj) {
                    list = [];

                    if (JXG.isArray(obj)) {
                        for (i = 0; i < obj.length; i++) {
                            list.push(this.toJSAN(obj[i]));
                        }

                        return '[' + list.join(',') + ']';
                    }

                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            list.push(prop + ': ' + this.toJSAN(obj[prop]));
                        }
                    }

                    return '<<' + list.join(', ') + '>> ';
                }
                return 'null';
            case 'string':
                return '\'' + obj.replace(/(["'])/g, '\\$1') + '\'';
            case 'number':
            case 'boolean':
                return obj.toString();
            case 'null':
                return 'null';
            }
        },

        /**
         * Saves the construction in <tt>board</tt> to JessieScript.
         * @param {JXG.Board} board
         * @returns {String} JessieScript
         */
        toJessie: function (board) {
            var i,
                elements = this.dump(board),
                script = [];

            script.push('$board.setView(' + JXG.toJSON(board.getBoundingBox()) + ');');

            for (i = 0; i < elements.length; i++) {
                if (elements[i].attributes.name.length > 0) {
                    script.push('// ' + elements[i].attributes.name);
                }

                script.push('s' + i + ' = ' + elements[i].type + '(' + elements[i].parents.join(', ') + ') ' + this.toJSAN(elements[i].attributes).replace(/\n/, '\\n') + ';');
                script.push('');
            }

            return script.join('\n');
        },

        /**
         * Saves the construction in <tt>board</tt> to JavaScript.
         * @param {JXG.Board} board
         * @returns {String} JavaScript
         */
        toJavaScript: function (board) {
            var i,
                elements = this.dump(board),
                script = [];

            script.push('board.setBoundingBox(' + JXG.toJSON(board.getBoundingBox()) + ');');

            for (i = 0; i < elements.length; i++) {
                script.push('board.create("' + elements[i].type + '", [' + elements[i].parents.join(', ') + '], ' + JXG.toJSON(elements[i].attributes) + ');');
            }

            return script.join('\n');
        }
    };
}());