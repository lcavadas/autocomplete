/* globals jQuery:true */
/*!
 * jQuery Plugin for Autocomplete
 *
 * @author Luis Serralheiro
 */
(function ($) {
  $.fn.autocomplete = function (options) {

    var _$this = $(this);
    var _wordRegex = /((?!\\)."|^").*?((?!\\)."|$)|[^\s]+/gi;
    var _idx;
    var _selected;
    var clickedInside = true;

    var settings = $.extend({
      collection: 'languages',
      separator: 'and',
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
    var _$display = $('<div class="autocomplete" style="z-index:9999999;display:none;position:absolute; background-color: white;border: 1px solid #999;top:' + settings.offset.y + 'px;left:' + settings.offset.x + 'px; max-height: 40%; overflow-y: auto;overflow-x: none;"></div>');
    var _$tester = $('<span style="display: none; position: absolute;margin:0;"></span>');
    _$tester.css('font-weight', _$this.css('font-weight'));
    _$tester.css('font-size', _$this.css('font-size'));
    _$tester.css('padding', _$this.css('padding'));
    _$tester.css('margin', _$this.css('margin'));
    _$tester.css('font-family', _$this.css('font-family'));
    _$this.after(_$display);
    _$display.after(_$tester);
    _$display.append(_$options);

    $(document.body).bind('mousedown', function (e) {
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
        var matchingValues = [];
        values.forEach(function (value) {
          if (value.toLowerCase().indexOf(filterText) >= 0) {
            matchingValues.push(value);
          }
        });
        if (matchingValues.length > 200) {
          matchingValues = values.slice(0, 200);
        }
        matchingValues.forEach(function (value, idx) {
          var $li = $('<li style="padding: .2em .5em;cursor:pointer;"></li>');
          $li.bind('mousedown click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            _selected = idx;
            _performSelection(text);
          });
          _$options.append($li.html(value));
        });
        _$display.show();
        _updateSelection();
      }
    };

    var _handler = function (e) {
      var searchText = _$this.val().substr(0, _$this.caret());
      var text;
      if (settings.separator) {
        var words = searchText.match(_wordRegex) || [];
        var split = [];
        words.forEach(function (word) {
          if (word.trim() === settings.separator) {
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

      var quotes = text.match(/((?!\\).{1}"|^")./g) || [];
      var wordEnd = text.match(/ $/i);
      var valueIdx = (match.length - 1 + (wordEnd ? (quotes.length % 2 === 0 ? 1 : 0) : 0)) % settings.values.length;
      text = match.length > valueIdx ? match[valueIdx].trim() : '';

      if (e.keyCode === 13 || e.keyCode === 9) {//enter or tab
        _performSelection(text);
      } else if (e.keyCode === 27) {//escape
        settings.handler(e);
      } else if (e.keyCode !== 40 && e.keyCode !== 38 && e.keyCode !== 33 && e.keyCode !== 34) {//up, down, page up and page down
        if (!_$this.range().length) {
          if (valueIdx !== _idx) {
            _idx = valueIdx;
          }
          _$display.css('left', (_$tester.html(_$this.val().substr(0, _$this.caret())).outerWidth() + settings.offset.x) + 'px');
          _filter(match, text);
        }
        settings.handler(e);
      }
    };

    function getValuesForText() {
      var searchText = _$this.val().substr(0, _$this.caret());
      var text_;
      if (settings.separator) {
        var words = searchText.match(_wordRegex) || [];
        var split = [];
        words.forEach(function (word) {
          if (word.trim() === settings.separator) {
            split = [];
          } else {
            split.push(word);
          }
        });
        text_ = split.join(" ");
        if (split.length && searchText[searchText.length - 1] === ' ') {
          text_ = text_ + ' ';
        }
      }

      var match = text_.match(_wordRegex);
      if (!match) {
        match = [''];
      }
      var values = typeof settings.values[_idx] === 'function' ? settings.values[_idx](match) : settings.values[_idx];
      return values;
    }

    var _performSelection = function (text) {
      var selectedText = $(_$options.find('li').get(_selected)).text();
      if (!selectedText) {
        return;
      }
      var positionStart = _$this.caret();
      var completeText = _$this.val();
      var insertText = (selectedText.indexOf(' ') !== -1 && selectedText.indexOf('"') === -1 ? '"' + selectedText + '"' : selectedText) + ' ';
      var positionEnd = completeText.length;
      if (positionStart !== positionEnd) {
        if (insertText[0] === '"') {
          positionEnd = completeText.indexOf('"', positionStart) + 2;
        } else {
          positionEnd = completeText.indexOf(' ', positionStart) + 1;
        }
      }
      var newText = completeText.substr(0, positionStart - text.length) + insertText + completeText.substr(positionEnd, completeText.length - positionEnd);
      if (settings.select(_idx, selectedText)) {
        _$this.val(newText);
        _$this.caret(positionEnd > positionStart ? positionEnd : positionStart + insertText.length);
        _$this.trigger('keyup', {keyCode: 20});
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
      }
    };

  };
}(jQuery));
