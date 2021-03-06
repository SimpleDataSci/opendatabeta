var sigInst, canvas, $GP
var config = {};

function isSafari() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
        if (ua.indexOf('chrome') > -1) {
            return false;
        } else {
            return true;
        }
    }
    return false;
}

function try_something(s) {
    var a = sigInst._core;
    a.clearSchedule();
    sigInst.refresh();
    sigInst.iterNodes(function(n) {
        if (n.id == s) {
            if (a.mousecaptor.ratio < 3.0) {
                sigInst.zoomTo(a.domElements.nodes.width / 2, a.domElements.nodes.height / 2, a.mousecaptor.ratio);
            } else {
                sigInst.zoomTo(a.domElements.nodes.width / 2, a.domElements.nodes.height / 2, a.mousecaptor.ratio);
            }
        }
    }).draw(2, 2, 2);
}

function wamuGetBrowserName() {
    var $browserName;
    if (navigator.userAgent.match(/Android/i)) {
        $browserName = "Android";
    } else if (navigator.userAgent.match(/webOS/i)) {
        $browserName = "webOS";
    } else if (navigator.userAgent.match(/iPhone/i)) {
        $browserName = "iPhone";
    } else if (navigator.userAgent.match(/iPad/i)) {
        $browserName = "iPad";
    } else if (navigator.userAgent.match(/iPod/i)) {
        $browserName = "iPod";
    } else if (navigator.userAgent.match(/BlackBerry/i)) {
        $browserName = "BlackBerry";
    } else {
        $browserName = "Other";
    }
    $browserName = $browserName.toLowerCase();
    return $browserName;
}

function getEdgeSize(a, b) {
    var edgeSize = 0;
    var edgeAmount = 0.0;
    sigInst.iterEdges(function(h) {
        if ((h.source == a && h.target == b) || (h.source == b && h.target == a)) {
            edgeSize = h.size;
            edgeAmount = h.attr['amount'];
        }
    });
    return [edgeSize, edgeAmount];
}

function getNodeID(labelName) {
    var nodeID = 0;
    sigInst.iterNodes(function(a) {
        if (a.label == labelName.replace('#', '')) {
            nodeID = a.id;
        }
    });
    return nodeID;
}

function GetQueryStringParams(sParam, defaultVal) {
    var sPageURL = "" + window.location;
    if (sPageURL.indexOf("?") == -1) return defaultVal;
    sPageURL = sPageURL.substr(sPageURL.indexOf("?") + 1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
    return defaultVal;
}
if (wamuGetBrowserName() == "other") {
    jQuery.getJSON(GetQueryStringParams("config", "https://s3.us-east-2.amazonaws.com/opendatabeta/config2.json"), function(data, textStatus, jqXHR) {
        config = data;
        if (config.type != "network") {
            alert("Invalid configuration settings.")
            return;
        }
        $(document).ready(setupGUI(config));
    });
} else {
    jQuery.getJSON(GetQueryStringParams("config", "https://s3.us-east-2.amazonaws.com/opendatabeta/config2.mob.json"), function(data, textStatus, jqXHR) {
        config = data;
        if (config.type != "network") {
            alert("Invalid configuration settings.")
            return;
        }
        $(document).ready(setupGUI(config));
    });
}
Object.size = function(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function initSigma(config) {
    var data = config.data
    var drawProps, graphProps, mouseProps;
    if (config.sigma && config.sigma.drawingProperties)
        drawProps = config.sigma.drawingProperties;
    else
        drawProps = {
            defaultLabelColor: "#000",
            defaultLabelSize: 14,
            defaultLabelBGColor: "#ddd",
            defaultHoverLabelBGColor: "#002147",
            defaultLabelHoverColor: "#fff",
            labelThreshold: 10,
            defaultEdgeType: "curve",
            hoverFontStyle: "bold",
            fontStyle: "bold",
            activeFontStyle: "bold"
        };
    if (config.sigma && config.sigma.graphProperties)
        graphProps = config.sigma.graphProperties;
    else
        graphProps = {
            minNodeSize: 1,
            maxNodeSize: 7,
            minEdgeSize: 0.2,
            maxEdgeSize: 0.5
        };
    if (config.sigma && config.sigma.mouseProperties)
        mouseProps = config.sigma.mouseProperties;
    else
        mouseProps = {
            minRatio: 0.75,
            maxRatio: 20,
        };
    var a = sigma.init(document.getElementById("sigma-canvas")).drawingProperties(drawProps).graphProperties(graphProps).mouseProperties(mouseProps);
    sigInst = a;
    a.active = !1;
    a.neighbors = {};
    a.detail = !1;
    dataReady = function() {
        a.clusters = {};
        a.iterNodes(function(b) {
            a.clusters[b.color] || (a.clusters[b.color] = []);
            a.clusters[b.color].push(b.id);
        });
        a.bind("upnodes", function(a) {
            nodeActive(a.content[0])
        });
        a.draw();
        configSigmaElements(config);
    }
    if (data.indexOf("gexf") > 0 || data.indexOf("xml") > 0)
        a.parseGexf(data, dataReady);
    else {
        a.parseJson(data, dataReady);
        gexf = sigmaInst = null;
    }
    
}

function setupGUI(config) {
    var logo = "";
    if (config.logo.file) {
        logo = "<img src=\"" + config.logo.file + "\"";
        if (config.logo.text) logo += " alt=\"" + config.logo.text + "\"";
        logo += ">";
    } else if (config.logo.text) {
        logo = "<h1>" + config.logo.text + "</h1>";
    }
    if (config.logo.link) logo = "<a href=\"" + config.logo.link + "\">" + logo + "</a>";
    $("#maintitle").html(logo);
    $("#title").html("<h2>" + config.text.title + "</h2>");
    $("#titletext").html(config.text.intro);
    if (config.text.more) {
        $("#information").html(config.text.more);
    } else {
        $("#moreinformation").hide();
    }
    if (config.legend.nodeLabel) {
        $(".node").next().html(config.legend.nodeLabel);
    } else {
        $(".node").hide();
    }
    if (config.legend.edgeLabel) {
        $(".edge").next().html(config.legend.edgeLabel);
    } else {
        $(".edge").hide();
    }
    if (config.legend.nodeLabel) {
        $(".colours").next().html(config.legend.colorLabel);
    } else {
        $(".colours").hide();
    }
    $GP = {
        calculating: !1,
        showgroup: !1
    };
    $GP.intro = $("#intro");
    $GP.minifier = $GP.intro.find("#minifier");
    $GP.mini = $("#minify");
    $GP.info = $("#attributepane");
    $GP.main = $("#mainpanel");
    $GP.info_header = $GP.info.find(".mainheader");
    $GP.info_details = $GP.info.find(".details");
    $GP.info_image = $GP.info.find(".image");
    $GP.info_donnees = $GP.info.find(".nodeattributes");
    $GP.info_name = $GP.info.find(".name");
    $GP.info_link = $GP.info.find(".link");
    $GP.info_data = $GP.info.find(".data");
    $GP.info_close = $GP.info.find(".returntext");
    $GP.info_close2 = $GP.info.find(".close");
    $GP.main_hide = $GP.main.find(".hide");
    $GP.mainpanel = $GP.main.find(".col");
    $GP.info_p = $GP.info.find(".p");
    $GP.info_close.click(function() {
        $GP.info.delay(50).animate({
            width: 'hide'
        }, 50);
    });
    $GP.info_close2.click(function() {
        $GP.info.delay(50).animate({
            width: 'hide'
        }, 50);
    });
    $GP.main_hide.toggle(function() {
        $GP.main.delay(1).animate({
            left: '-250px'
        }, 50);
    }, function() {
        $GP.main.delay(1).animate({
            left: '0px'
        }, 50);
    });
    $GP.form = $("#mainpanel").find("form");
    $GP.search = new Search($GP.form.find("#search"));
    if (!config.features.search) {
        $("#search").hide();
    }
    if (!config.features.groupSelectorAttribute) {
        $("#attributeselect").hide();
    }
    $GP.cluster = new Cluster($GP.form.find("#attributeselect"));
    config.GP = $GP;
    initSigma(config);
    cleanPanel();
    showKey();
    $('#zoom .z[rel="full"]').addClass('inactive');
    $('#zoom .z[rel="details"]').addClass('inactive');
}

function configSigmaElements(config) {
    $GP = config.GP;
    if (config.features.hoverBehavior == "dim") {
        var greyColor = '#ccc';
        sigInst.bind('overnodes', function(event) {
            var nodes = event.content;
            var neighbors = {};
            sigInst.iterEdges(function(e) {
                if (nodes.indexOf(e.source) < 0 && nodes.indexOf(e.target) < 0) {
                    if (!e.attr['grey']) {
                        e.attr['true_color'] = e.color;
                        e.color = greyColor;
                        e.attr['grey'] = 1;
                    }
                } else {
                    e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
                    e.attr['grey'] = 0;
                    neighbors[e.source] = 1;
                    neighbors[e.target] = 1;
                }
            }).iterNodes(function(n) {
                if (!neighbors[n.id]) {
                    if (!n.attr['grey']) {
                        n.attr['true_color'] = n.color;
                        n.color = greyColor;
                        n.attr['grey'] = 1;
                    }
                } else {
                    n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
                    n.attr['grey'] = 0;
                }
            }).draw(2, 2, 2);
        }).bind('outnodes', function() {
            sigInst.iterEdges(function(e) {
                e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
                e.attr['grey'] = 0;
            }).iterNodes(function(n) {
                n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
                n.attr['grey'] = 0;
            }).draw(2, 2, 2);
        });
    } else if (config.features.hoverBehavior == "hide") {
        sigInst.bind('overnodes', function(event) {
            var nodes = event.content;
            var neighbors = {};
            sigInst.iterEdges(function(e) {
                if (nodes.indexOf(e.source) >= 0 || nodes.indexOf(e.target) >= 0) {
                    neighbors[e.source] = 1;
                    neighbors[e.target] = 1;
                }
            }).iterNodes(function(n) {
                if (!neighbors[n.id]) {
                    n.hidden = 1;
                } else {
                    n.hidden = 0;
                }
            }).draw(2, 2, 2);
        }).bind('outnodes', function() {
            sigInst.iterEdges(function(e) {
                e.hidden = 0;
            }).iterNodes(function(n) {
                n.hidden = 0;
            }).draw(2, 2, 2);
        });
    }
    $GP.bg = $(sigInst._core.domElements.bg);
    $GP.bg2 = $(sigInst._core.domElements.bg2);
    var a = [],
        b, x = 1;
    for (b in sigInst.clusters) {
        cName = "";
        if (b == "rgba(185,0,0,1.0)") {
            cName = "Former Officials";
        } else if (b == "rgb(4,10,69)") {
            cName = "Developers";
        } else if (b == "rgb(255,0,0)") {
            cName = "Officials Currently in Office";
        }
        a.push('<div style="line-height:12px"><a href="#' + b + '"><div style="width:40px;height:12px;border:1px solid #fff;background:' + b + ';display:inline-block"></div> ' + cName + ' (' + sigInst.clusters[b].length + ')</a></div>');
    }
    $GP.cluster.content(a.join(""));
    b = {
        minWidth: 400,
        maxWidth: 800,
        maxHeight: 600
    };
    $("a.fb").fancybox(b);
    $("#zoom").find("div.z").each(function() {
        var a = $(this),
            b = a.attr("rel");
        a.click(function() {
            if (b == "center") {
                sigInst.position(0, 0, 1).draw();
            } else if (b == "details") {
                showDetails();
            } else if (b == "full") {
                showFull();
            } else if (b == "key") {
                showKey();
            } else if (b != "spacer") {
                var a = sigInst._core;
                sigInst.zoomTo(a.domElements.nodes.width / 2, a.domElements.nodes.height / 2, a.mousecaptor.ratio * ("in" == b ? 1.5 : 0.5));
            }
        })
    });
    $GP.mini.click(function() {
        $GP.mini.hide();
        $GP.intro.show();
        $GP.minifier.show()
    });
    $GP.minifier.click(function() {
        $GP.intro.hide();
        $GP.minifier.hide();
        $GP.mini.show()
    });
    $GP.intro.find("#showGroups").click(function() {
        !0 == $GP.showgroup ? showGroups(!1) : showGroups(!0)
    });
    a = window.location.hash.substr(1);
    if (0 < a.length) switch (a) {
        case "Groups":
            showGroups(!0);
            break;
        case "information":
            $.fancybox.open($("#information"), b);
            break;
        default:
            $GP.search.exactMatch = !0, $GP.search.search(a)
            $GP.search.clean();
    }
}

function Search(a) {
    this.input = a.find("input[name=search]");
    this.state = a.find(".state");
    this.results = a.find(".results");
    this.exactMatch = !1;
    this.lastSearch = "";
    this.searching = !1;
    var b = this;
    this.input.focus(function() {
        var a = $(this);
        a.data("focus") || (a.data("focus", !0), a.removeClass("empty"));
        b.clean()
    });
    this.input.keydown(function(a) {
        if (13 == a.which) return b.state.addClass("searching"), b.search(b.input.val()), !1
    });
    this.state.click(function() {
        var a = b.input.val();
        b.searching && a == b.lastSearch ? (b.close(), $('#zoom .z[rel="key"]').removeClass('active')) : (b.state.addClass("searching"), b.search(a))
    });
    this.dom = a;
    this.close = function() {
        this.state.removeClass("searching");
        this.results.hide();
        this.searching = !1;
        this.input.val("");
        nodeNormal()
    };
    this.clean = function() {
        this.results.empty().hide();
        this.state.removeClass("searching");
        this.input.val("");
    };
    this.search = function(a) {
        var b = !1,
            c = [],
            b = this.exactMatch ? ("^" + a + "$").toLowerCase() : a.toLowerCase(),
            g = RegExp(b);
        this.exactMatch = !1;
        this.searching = !0;
        this.lastSearch = a;
        this.results.empty();
        if (2 >= a.length) this.results.html("<i>You must search for a name with a minimum of 3 letters.</i>");
        else {
            sigInst.iterNodes(function(a) {
                g.test(a.label.toLowerCase()) && c.push({
                    id: a.id,
                    name: a.label
                })
            });
            c.length ? (b = !0, nodeActive(c[0].id)) : b = showCluster(a);
            a = ["<b>Search Results: </b>"];
            if (1 < c.length)
                for (var d = 0, h = c.length; d < h; d++) a.push('<a href="#' + c[d].name + '" onclick="nodeActive(\'' + c[d].id + "')\">" + c[d].name + "</a>");
            0 == c.length && !b && a.push("<i>No results found.</i>");
            1 < a.length && this.results.html(a.join(""));
        }
        if (c.length != 1) this.results.show();
        if (c.length == 1) this.results.hide();
    }
}

function Cluster(a) {
    this.cluster = a;
    this.display = !1;
    this.list = this.cluster.find(".list");
    this.list.empty();
    this.select = this.cluster.find(".select");
    this.select.click(function() {
        $GP.cluster.toggle()
    });
    this.toggle = function() {
        this.display ? this.hide() : this.show()
    };
    this.content = function(a) {
        this.list.html(a);
        this.list.find("a").click(function() {
            var a = $(this).attr("href").substr(1);
            showCluster(a)
        })
    };
    this.hide = function() {
        this.display = !1;
        this.list.hide();
        this.select.removeClass("close")
    };
    this.show = function() {
        this.display = !0;
        this.list.show();
        this.select.addClass("close")
    }
}

function showGroups(a) {
    a ? ($GP.intro.find("#showGroups").text("Hide groups"), $GP.bg.show(), $GP.bg2.hide(), $GP.showgroup = !0) : ($GP.intro.find("#showGroups").text("View Groups"), $GP.bg.hide(), $GP.bg2.show(), $GP.showgroup = !1)
}

function nodeNormal() {
    !0 != $GP.calculating && !1 != sigInst.detail && (showGroups(!1), $GP.calculating = !0, sigInst.detail = !0, $GP.info.delay(0).animate({
        width: 'hide'
    }, 0), $GP.cluster.hide(), sigInst.iterEdges(function(a) {
        a.attr.color = !1;
        a.hidden = !1
    }), sigInst.iterNodes(function(a) {
        a.hidden = !1;
        a.attr.color = !1;
        a.attr.lineWidth = !1;
        a.attr.size = !1
    }), sigInst.draw(2, 2, 2, 2), sigInst.neighbors = {}, sigInst.active = !1, $GP.calculating = !1, window.location.hash = "")
    $('#zoom .z[rel="details"]').addClass('inactive');
    $('#zoom .z[rel="full"]').addClass('inactive');
}

function nodeActive(a) {
    $('#zoom .z[rel="full"]').removeClass('inactive');
    $('#zoom .z[rel="details"]').removeClass('inactive');
    cleanPanel();
    var groupByDirection = false;
    if (config.informationPanel.groupByEdgeDirection && config.informationPanel.groupByEdgeDirection == true) groupByDirection = true;
    sigInst.neighbors = {};
    sigInst.detail = !0;
    var b = sigInst._core.graph.nodesIndex[a];
    showGroups(!1);
    var outgoing = {},
        incoming = {},
        mutual = {};
    sigInst.iterEdges(function(b) {
        b.attr.lineWidth = !1;
        b.hidden = !0;
        n = {
            name: b.label,
            colour: b.color
        };
        if (a == b.source) outgoing[b.target] = n;
        else if (a == b.target) incoming[b.source] = n;
        if (a == b.source || a == b.target) sigInst.neighbors[a == b.target ? b.source : b.target] = n;
        b.hidden = !1, b.attr.color = "rgba(0, 0, 0, 1)";
    });
    var f = [];
    sigInst.iterNodes(function(a) {
        a.hidden = !0;
        a.attr.lineWidth = !1;
        a.attr.color = a.color
    });
    if (groupByDirection) {
        for (e in outgoing) {
            if (e in incoming) {
                mutual[e] = outgoing[e];
                delete incoming[e];
                delete outgoing[e];
            }
        }
    }
    var createList = function(c) {
        var f = [];
        var e = [],
            g;
        for (g in c) {
            var d = sigInst._core.graph.nodesIndex[g];
            d.hidden = !1;
            d.attr.lineWidth = !1;
            d.attr.color = c[g].colour;
            var edgeVals = getEdgeSize(a, g);
            a != g && e.push({
                id: g,
                name: d.label,
                group: (c[g].name) ? c[g].name : "",
                colour: c[g].colour,
                size: edgeVals[0],
                amount: edgeVals[1],
            })
        }
        e.sort(function(a, b) {
            var c = a.amount;
            var d = b.amount;
            var e = a.size;
            var f = b.size;
            return (c != d) ? (c > d) ? -1 : (c < d) ? 1 : 0 : (e > f) ? -1 : (e < f) ? 1 : 0
        });
        d = "";
        for (g in e) {
            c = e[g];
            var contribution = "contribution";
            if (c.size > 1) {
                contribution = "contributions";
            }
            f.push('<li class="membership"><a href="#' + c.name + '" onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' + c.id + '\'])\" onclick=\"nodeActive(\'' + c.id + '\')" onmouseout="sigInst.refresh()"><b>' + c.name + '</b></a><div class="bar" style="width:' + (((c.amount / e[0].amount) * 100)) + '%;">' + '</div><sub><b>' + c.size + '</b> ' + contribution + ' totalling' + '<b> $' + c.amount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</b></sub></li>');
        }
        return f;
    }
    var f = [];
    if (groupByDirection) {
        size = Object.size(mutual);
        f.push("<h2>Mututal (" + size + ")</h2>");
        (size > 0) ? f = f.concat(createList(mutual)): f.push("No mutual links<br>");
        size = Object.size(incoming);
        f.push("<h2>Incoming (" + size + ")</h2>");
        (size > 0) ? f = f.concat(createList(incoming)): f.push("No incoming links<br>");
        size = Object.size(outgoing);
        f.push("<h2>Outgoing (" + size + ")</h2>");
        (size > 0) ? f = f.concat(createList(outgoing)): f.push("No outgoing links<br>");
    } else {
        f = f.concat(createList(sigInst.neighbors));
    }
    b.hidden = !1;
    b.attr.color = b.color;
    b.attr.lineWidth = 6;
    b.attr.strokeStyle = "#000000";
    sigInst.draw(2, 2, 2, 2);
    $GP.info_link.find("ul").html(f.join(""));
    $GP.info_link.find("li").each(function() {
        var a = $(this),
            b = a.attr("rel");
    });
    f = b.attr;
    var min_year = 0;
    var max_year = 0;
    if (f.attributes) {
        var image_attribute = false;
        if (config.informationPanel.imageAttribute) {
            image_attribute = config.informationPanel.imageAttribute;
        }
        e = [];
        q = [];
        r = [];
        temp_array = [];
        g = 0;
        var candidate = false;
        if (b.attr.color == 'rgb(253,149,149)' || b.attr.color == 'rgb(255,0,0)') {
            candidate = true;
        }
        for (var attr in f.attributes) {
            var d = f.attributes[attr],
                h = "";
            if (attr == "Title") {
                q.push('<br/>' + d);
            } else if (attr == "Ward") {
                if (d == "At Large") {
                    q.push(', ' + d);
                } else {
                    q.push(', Ward ' + d);
                }
            } else if (attr == "Image") {
                $GP.info_image.html(d);
            } else if (attr == "Total Developer Donations") {
                var direction = " given";
                if (candidate == true) {
                    direction = " received";
                }
                if (d > 1) {
                    r.push('<br/><b>' + d + '</b> contributions' + direction);
                } else {
                    r.push('<br/><b>' + d + '</b> contribution' + direction);
                }
            } else if (attr == "Total Donation Amount") {
                r.push('<br/><b>$' + d.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</b> total');
            } else if (attr == "Min Year") {
                min_year = d;
            } else if (attr == "Max Year") {
                max_year = d;
            } else if (attr != "Incumbent" && attr != "Affiliates Redundant") {
                h = '<div class="p">' + attr + '</div> ' + d + '<br/>'
                e.push(h)
            }
        }
        if (image_attribute) {
            $GP.info_name.html("<div><img src=" + f.attributes[image_attribute] + " style=\"vertical-align:middle\" /> <span onmouseover=\"sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex['" + b.id + '\'])" onmouseout="sigInst.refresh()">' + b.label + "</span></div>");
        } else {
            q.unshift("<span class='head' onmouseover=\"sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex['" + b.id + '\'])" onmouseout="sigInst.refresh()" >' + b.label + "</span>");
        }
        $GP.info_data.html(e.join("<br/>"));
        $GP.info_name.html(q.join(''));
        $GP.info_details.html(r.join(''));
    }
    $GP.info_data.show();
    $GP.info_p.html('');
    if (min_year == max_year) {
        $GP.info_p.html("Contributions (" + max_year + ")");
    } else {
        $GP.info_p.html("Contributions (" + min_year + "-" + max_year + ")");
    }
    $GP.info.animate({
        width: 'show'
    }, 0);
    $('#zoom .z[rel="details"]').addClass('active');
    $GP.info_donnees.hide();
    $GP.info_donnees.show();
    sigInst.active = a;
    window.location.hash = b.label;
    $('.nodeattributes').scrollTop(0);
    delete min_year;
    delete max_year;
}

function showCluster(a) {
    cleanPanel();
    $('#zoom .z[rel="full"]').removeClass('inactive');
    $('#zoom .z[rel="details"]').removeClass('inactive');
    var b = sigInst.clusters[a];
    if (b && 0 < b.length) {
        showGroups(!1);
        sigInst.detail = !0;
        b.sort(function(a, g) {
            var h = sigInst._core.graph.nodesIndex[a];
            var i = sigInst._core.graph.nodesIndex[g];
            var c = h.attr.attributes["Total Donation Amount"];
            var d = i.attr.attributes["Total Donation Amount"];
            var e = h.attr.attributes["Total Developer Donations"];
            var f = i.attr.attributes["Total Developer Donations"];
            return (c != d) ? (c > d) ? -1 : (c < d) ? 1 : 0 : (e > f) ? -1 : (e < f) ? 1 : 0
        });
        sigInst.iterEdges(function(a) {
            a.hidden = !1;
            a.attr.lineWidth = !1;
            a.attr.color = !1
        });
        sigInst.iterNodes(function(a) {
            a.hidden = !0
        });
        for (var f = [], e = [], c = 0, g = b.length; c < g; c++) {
            var d = sigInst._core.graph.nodesIndex[b[c]];
            var contribution = "contribution";
            if (d.attr.attributes["Total Developer Donations"] > 1) {
                contribution = "contributions";
            }!0 == d.hidden && (e.push(b[c]), d.hidden = !1, d.attr.lineWidth = !1, d.attr.color = d.color, f.push('<li class="membership"><a href="#' + d.label + '" onmouseover="sigInst._core.plotter.drawHoverNode(sigInst._core.graph.nodesIndex[\'' + d.id + '\'])\" onclick=\"nodeActive(\'' + d.id + '\')" onmouseout="sigInst.refresh()"><b>' + d.label + '</b></a><div class="bar" style="width:' + (((d.attr.attributes["Total Donation Amount"] / sigInst._core.graph.nodesIndex[b[0]].attr.attributes["Total Donation Amount"]) * 100)) + '%;">' + '</div><sub><b>' + d.attr.attributes["Total Developer Donations"] + '</b> ' + contribution + ' totalling' + ' <b>$' + d.attr.attributes["Total Donation Amount"].toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</b></sub></li>'))
        }
        sigInst.clusters[a] = e;
        sigInst.draw(2, 2, 2, 2);
        showDetails();
        cName = '';
        if (a == "rgb(253,149,149)") {
            cName = "Candidates/Former Officials";
        } else if (a == "rgb(137,147,163)") {
            cName = "Developers";
        } else if (a == "rgb(255,0,0)") {
            cName = "Officials Currently in Office";
        }
        $GP.info_name.html('<span class="head">' + cName + '</span>');
        $GP.info_p.html("");
        $GP.info_link.find("ul").html(f.join(""));
        $GP.info.animate({
            width: 'show'
        }, 0);
        $GP.search.clean();
        $GP.cluster.hide();
        $('.nodeattributes').scrollTop(0);
        return !0
    }
    return !1
}

function showKey() {
    if (!$GP.info.is(":visible")) {
        $GP.info.delay(0).animate({
            width: 'toggle'
        }, 0);
    }
    $("#zoom .z[rel='details']").removeClass('active');
    if ($('#zoom .z[rel="key"]').hasClass('active')) {
        $('#zoom .z[rel="key"]').removeClass('active');
        $GP.info.delay(0).animate({
            width: 'toggle'
        }, 0);
    } else {
        $('#zoom .z[rel="key"]').addClass('active');
        $GP.info_name.hide();
        $GP.info_image.hide();
        $GP.info_details.hide();
        $('.nodeattributes').hide();
        $GP.info_header.show();
        $('#mainpanel').show();
    }
}

function showDetails() {
    if (sigInst.active !== false || location.hash.indexOf("rgb(") === 1) {
        $("#zoom .z[rel='key']").removeClass('active');
        if (!$GP.info.is(":visible")) {
            $GP.info.delay(0).animate({
                width: 'toggle'
            }, 0);
        }
        if ($('#zoom .z[rel="details"]').hasClass('active')) {
            $('#zoom .z[rel="details"]').removeClass('active');
            $GP.info.delay(0).animate({
                width: 'toggle'
            }, 0);
        } else {
            $('#zoom .z[rel="details"]').addClass('active');
            $('.nodeattributes').show();
            $GP.info_name.show();
            $GP.info_image.show();
            $GP.info_details.show();
            $('#mainpanel').hide();
            $GP.info_header.hide();
        }
    }
}

function showFull() {
    if (sigInst.active || location.hash.indexOf('rgb') != -1) {
        nodeNormal();
        if ($('#zoom .z').hasClass('active')) {
            $('#zoom .z').removeClass('active');
        }
    }
    $('#zoom .z[rel="full"]').addClass('inactive');
    $GP.search.clean();
}

function reload() {
    delete sigma;
    if (wamuGetBrowserName() == "other") {
        jQuery.getJSON(GetQueryStringParams("config", "https://s3.us-east-2.amazonaws.com/opendatabeta/config.json"), function(data, textStatus, jqXHR) {
            config = data;
            if (config.type != "network") {
                alert("Invalid configuration settings.")
                return;
            }
            $(document).ready(setupGUI(config));
        });
    } else {
        jQuery.getJSON(GetQueryStringParams("config", "https://s3.us-east-2.amazonaws.com/opendatabeta/config.mob.json"), function(data, textStatus, jqXHR) {
            config = data;
            if (config.type != "network") {
                alert("Invalid configuration settings.")
                return;
            }
            $(document).ready(setupGUI(config));
        });
    }
}

function cleanPanel() {
    $("#mainpanel").hide();
    $GP.info_header.hide();
    $GP.info_data.html('');
    $GP.info_image.html('');
    $GP.info_name.html('');
    $GP.info_details.html('');
    $GP.info_name.show();
    $GP.info_details.show();
    $GP.info_image.show();
    $("#zoom .z[rel='key']").removeClass('active');
}