/* globals jQuery:true */
/*!
 * jQuery Plugin for Autocomplete
 *
 * @author Luis Serralheiro
 * @requires jQuery and acdvorak/jquery.caret
 */
(function ($) {
  $.fn.autocomplete = function (options) {

    var _$this = $(this);
    var _wordRegex = /((?!\\)."|^").*?((?!\\)."|$)|[^\s]+/gi;
    var _selected;
    var clickedInside = true;
    var _values;

    var settings = $.extend({
      collection: 'languages',
      separators: ['and'],
      offset: {
        y: 36,
        x: 6
      },
      values: [
        [
          'java',
          'javascript',
          'jubilee'
        ],
        [
          'is',
          'isn\'t'
        ],
        [
          'good',
          'bad'
        ],
        [
          'and'
        ]
      ],
      handler: function () {

      },
      select: function () {
        return true;
      }
    }, options);

    $("<style type='text/css'>.autocomplete .selected{ background-color:#036; color:white;} </style>").appendTo("head");
    var _$options = $('<ol style="list-style: none; padding: .5em; margin: 0;"></ol>');
    var _$display = $('<div class="autocomplete" style="z-index:9999999;display:none;position:absolute; background-color: white;border: 1px solid #999;top:' + settings.offset.y + 'px;left:' + settings.offset.x + 'px; max-height: 40%; overflow-y: auto;overflow-x: hidden;"></div>');
    var _$tester = $('<span style="display: none; position: absolute;margin:0;"></span>');
    _$tester.css('font-weight', _$this.css('font-weight'));
    _$tester.css('font-size', _$this.css('font-size'));
    _$tester.css('padding', _$this.css('padding'));
    _$tester.css('margin', _$this.css('margin'));
    _$tester.css('font-family', _$this.css('font-family'));
    _$this.after(_$display);
    _$display.after(_$tester);
    _$display.append(_$options);

    $(document.body).bind('mousedown', function () {
      clickedInside = false;
    });

    _$display.bind('mousedown', function (e) {
      clickedInside = true;
      e.preventDefault();
      e.stopPropagation();
    });

    var _updateSelection = function () {
      var _$li = _$options.find('li').removeClass('selected');
      if (!_$li.length) {
        _$display.hide();
        return;
      }
      _selected = _selected % _$li.length;
      var _$selected = $(_$li.get(_selected));
      _$selected.addClass('selected');
      if (_$display.scrollTop() + _$display.height() < _$selected.position().top + _$display.scrollTop() + _$selected.outerHeight()) {
        _$display.scrollTop(_$selected.position().top + _$display.scrollTop() + _$selected.outerHeight() - _$display.height() + 8);
      } else if (_$selected.position().top < 0) {
        _$display.scrollTop(_$display.scrollTop() + _$selected.position().top - 8);
      }
    };

    var _filter = function (match, text) {
      var filterText = (text[0] === '"' ? text.substr(1, text.length - 1) : text).toLowerCase();
      _selected = 0;
      _$options.html('');
      var values = getValuesForText();
      if (!values.length) {
        _$display.hide();
      } else {
        _values = [];
        values.forEach(function (value) {
          if (value.value.toLowerCase().indexOf(filterText) >= 0) {
            _values.push(value);
          }
        });
        if (_values.length > 200) {
          _values = values.slice(0, 200);
        }
        _values.forEach(function (value, idx) {
          var $li = $('<li style="padding: .2em .5em;cursor:pointer;"></li>');
          if (value.selected) {
            $li.addClass('selected');
            _selected = idx;
          }
          $li.bind('mousedown click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            _selected = idx;
            _performSelection(value, text);
          });
          _$options.append($li.html(value.text));
        });

        // chrome does not handle scrolls correctly for strings smaller than 4 chars
        if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
          if(_$options.height() > _$display.height()){
            _$display.css('overflow-y', 'scroll');
          } else {
            _$display.css('overflow-y', 'auto');
          }
        }

          _$display.show();
        _updateSelection();
      }
    };

    var _findValue = function (text) {
      var value;
      _values.forEach(function (val) {
        if (val.text === text) {
          value = val;
        }
      });
      return value;
    };

    var _getCurrent = function () {
      var searchText = _$this.val().substr(0, _$this.caret());
      var text;
      if (settings.separators) {
        var words = searchText.match(_wordRegex) || [];
        var split = [];
        words.forEach(function (word) {
          if (settings.separators.indexOf(word.trim()) !== -1) {
            split = [];
          } else {
            split.push(word);
          }
        });
        text = split.join(" ");
        if (split.length && searchText[searchText.length - 1] === ' ') {
          text = text + ' ';
        }
      }

      var match = text.match(_wordRegex);
      if (!match) {
        match = [''];
      }

      var quotes = text.match(/((?!\\)."|^")./g) || [];
      var wordEnd = text.match(/ $/i);
      var valueIdx = (match.length - 1 + (wordEnd ? (quotes.length % 2 === 0 ? 1 : 0) : 0)) % settings.values.length;
      return {match: match, text: match.length > valueIdx ? match[valueIdx].trim() : '', idx: valueIdx};
    };

    var _handler = function (e) {
      var current = _getCurrent();
      if (e.keyCode === 13 || e.keyCode === 9) {//enter or tab
        _performSelection(_findValue(_$options.find('.selected').text()), current.text);
      } else if (e.keyCode === 27) {//escape
        settings.handler(e);
      } else if (e.keyCode !== 40 && e.keyCode !== 38 && e.keyCode !== 33 && e.keyCode !== 34) {//up, down, page up and page down
        if (!_$this.range().length) {
          _$display.css('left', Math.min(_$tester.html(_$this.val().substr(0, _$this.caret())).outerWidth() + settings.offset.x, _$this.width() - _$display.width()) + 'px');
          _filter(current.match, current.text);
        }
        settings.handler(e);
      }
    };

    function getValuesForText() {
      var current = _getCurrent();
      var values = typeof settings.values[current.idx] === 'function' ? settings.values[current.idx](current.match) : settings.values[current.idx];
      var options = [];
      values.forEach(function (val) {
        if (typeof val === 'object') {
          options.push(val);
        } else {
          options.push({text: val, value: val});
        }
      });
      return options;
    }

    var _performSelection = function (value) {
      var current = _getCurrent();

      var selectedText = value.value;
      if (!selectedText) {
        return;
      }
      var positionStart = _$this.caret();
      var completeText = _$this.val();
      var insertText = (selectedText.indexOf(' ') !== -1 && selectedText.indexOf('"') === -1 ? '"' + selectedText + '"' : selectedText) + ' ';
      if (value.partial) {
        insertText = insertText.substr(0, insertText.length - 1);
      }
      var positionEnd = completeText.length;
      if (positionStart !== positionEnd) {
        if (current.text[0] === '"') {
          positionEnd = completeText.indexOf('"', positionStart) + 2;
        } else {
          positionEnd = completeText.indexOf(' ', positionStart) + 1;
        }
      }
      var newText = completeText.substr(0, positionStart - current.text.length) + insertText + completeText.substr(positionEnd, completeText.length - positionEnd);
      if (settings.select(current.idx, selectedText)) {
        _$this.focus();
        _$this.val(newText);
        _$this.caret(positionEnd > positionStart ? positionEnd : positionStart + insertText.length);
        _$this.trigger('keyup', {keyCode: 20});
        _$this.scrollLeft(_$this[0].scrollWidth);
      }
    };

    _$this.bind('focus', function () {
      window.setTimeout(function () {
        _$display.show();
        _$this.trigger('keyup', {keyCode: 20});
      }, 100);
    });

    _$this.bind('focusout', function () {
      if (clickedInside) {
        _$this.focus();
      } else {
        _$display.hide();
      }
    });

    _$this.bind(['keyup', 'drop', 'paste', 'click'].join(' '), _handler);
    _$this.bind('keydown', function (e) {
      if (e.keyCode === 9) {//tab
        e.preventDefault();
      } else if (e.keyCode === 40) {//down
        e.preventDefault();
        _updateSelection(++_selected);
      } else if (e.keyCode === 38) {//up
        e.preventDefault();
        _updateSelection(--_selected);
      } else if (e.keyCode === 34) {//page down
        e.preventDefault();
        _selected += 10;
        _updateSelection(_selected);
      } else if (e.keyCode === 33) {//page up
        e.preventDefault();
        _selected -= 10;
        _updateSelection(--_selected);
      }
    });

    return {
      close: function () {
        _$display.hide();
      },
      destroy: function () {
        _$display.remove();
        _$this.unbind(['keyup', 'keydown', 'drop', 'paste', 'click', 'focus', 'focusout']);
      }
    };

  };
}(jQuery));
