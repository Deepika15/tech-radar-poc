const d3 = require('d3')
const d3tip = require('d3-tip')
const Chance = require('chance')
const XLSX = require("xlsx");
// const express = require('express')
const _ = require('lodash/core')

const RingCalculator = require('../util/ringCalculator')
const QueryParams = require('../util/queryParamProcessor')
const ContentValidator = require('../util/contentValidator')
const InputSanitizer = require('../util/inputSanitizer')
const AutoComplete = require('../util/autoComplete')
const config = require('../config')
const { csvFormatRow } = require('d3')

const MIN_BLIP_WIDTH = 12
const ANIMATION_DURATION = 1000
const SERVER_URL = "http://localhost:5000/";

const ringOptions = ['Adopt', 'Trial', 'Assess', 'Hold'];
const quadrantOptions = ['Platform & Services', 'Tools', 'Automation', 'Lang. & Framework'];


const Radar = function (size, radar) {
  var svg, radarElement, quadrantButtons, utilityButtons, buttonsGroup, header, alternativeDiv

  var tip = d3tip()
    .attr('class', 'd3-tip')
    .html(function (text) {
      return text
    })

  tip.direction(function () {
    if (d3.select('.quadrant-table.selected').node()) {
      var selectedQuadrant = d3.select('.quadrant-table.selected')
      if (selectedQuadrant.classed('first') || selectedQuadrant.classed('fourth')) {
        return 'ne'
      } else {
        return 'nw'
      }
    }
    return 'n'
  })

  var ringCalculator = new RingCalculator(radar.rings().length, center())

  var self = {}
  var chance

  function center() {
    return Math.round(size / 2)
  }

  function toRadian(angleInDegrees) {
    return (Math.PI * angleInDegrees) / 180
  }

  function plotLines(quadrantGroup, quadrant) {
    var startX = size * (1 - (-Math.sin(toRadian(quadrant.startAngle)) + 1) / 2)
    var endX = size * (1 - (-Math.sin(toRadian(quadrant.startAngle - 90)) + 1) / 2)

    var startY = size * (1 - (Math.cos(toRadian(quadrant.startAngle)) + 1) / 2)
    var endY = size * (1 - (Math.cos(toRadian(quadrant.startAngle - 90)) + 1) / 2)

    if (startY > endY) {
      var aux = endY
      endY = startY
      startY = aux
    }

    quadrantGroup
      .append('line')
      .attr('x1', center())
      .attr('x2', center())
      .attr('y1', startY - 2)
      .attr('y2', endY + 2)
      .attr('stroke-width', 10)

    quadrantGroup
      .append('line')
      .attr('x1', endX)
      .attr('y1', center())
      .attr('x2', startX)
      .attr('y2', center())
      .attr('stroke-width', 10)
  }

  function plotQuadrant(rings, quadrant) {
    var quadrantGroup = svg
      .append('g')
      .attr('class', 'quadrant-group quadrant-group-' + quadrant.order)
      .on('mouseover', mouseoverQuadrant.bind({}, quadrant.order))
      .on('mouseout', mouseoutQuadrant.bind({}, quadrant.order))
      .on('click', selectQuadrant.bind({}, quadrant.order, quadrant.startAngle))

    rings.forEach(function (ring, i) {
      var arc = d3
        .arc()
        .innerRadius(ringCalculator.getRadius(i))
        .outerRadius(ringCalculator.getRadius(i + 1))
        .startAngle(toRadian(quadrant.startAngle))
        .endAngle(toRadian(quadrant.startAngle - 90))

      quadrantGroup
        .append('path')
        .attr('d', arc)
        .attr('class', 'ring-arc-' + ring.order())
        .attr('transform', 'translate(' + center() + ', ' + center() + ')')
    })

    return quadrantGroup
  }

  function plotTexts(quadrantGroup, rings, quadrant) {
    rings.forEach(function (ring, i) {
      if (quadrant.order === 'first' || quadrant.order === 'fourth') {
        quadrantGroup
          .append('text')
          .attr('class', 'line-text')
          .attr('y', center() + 4)
          .attr('x', center() + (ringCalculator.getRadius(i) + ringCalculator.getRadius(i + 1)) / 2)
          .attr('text-anchor', 'middle')
          .text(ring.name())
      } else {
        quadrantGroup
          .append('text')
          .attr('class', 'line-text')
          .attr('y', center() + 4)
          .attr('x', center() - (ringCalculator.getRadius(i) + ringCalculator.getRadius(i + 1)) / 2)
          .attr('text-anchor', 'middle')
          .text(ring.name())
      }
    })
  }

  function triangle(blip, x, y, order, group) {
    return group
      .append('path')
      .attr(
        'd',
        'M412.201,311.406c0.021,0,0.042,0,0.063,0c0.067,0,0.135,0,0.201,0c4.052,0,6.106-0.051,8.168-0.102c2.053-0.051,4.115-0.102,8.176-0.102h0.103c6.976-0.183,10.227-5.306,6.306-11.53c-3.988-6.121-4.97-5.407-8.598-11.224c-1.631-3.008-3.872-4.577-6.179-4.577c-2.276,0-4.613,1.528-6.48,4.699c-3.578,6.077-3.26,6.014-7.306,11.723C402.598,306.067,405.426,311.406,412.201,311.406',
      )
      .attr(
        'transform',
        'scale(' +
        blip.width / 34 +
        ') translate(' +
        (-404 + x * (34 / blip.width) - 17) +
        ', ' +
        (-282 + y * (34 / blip.width) - 17) +
        ')',
      )
      .attr('class', order)
  }

  function triangleLegend(x, y, group) {
    return group
      .append('path')
      .attr(
        'd',
        'M412.201,311.406c0.021,0,0.042,0,0.063,0c0.067,0,0.135,0,0.201,0c4.052,0,6.106-0.051,8.168-0.102c2.053-0.051,4.115-0.102,8.176-0.102h0.103c6.976-0.183,10.227-5.306,6.306-11.53c-3.988-6.121-4.97-5.407-8.598-11.224c-1.631-3.008-3.872-4.577-6.179-4.577c-2.276,0-4.613,1.528-6.48,4.699c-3.578,6.077-3.26,6.014-7.306,11.723C402.598,306.067,405.426,311.406,412.201,311.406',
      )
      .attr(
        'transform',
        'scale(' + 22 / 64 + ') translate(' + (-404 + x * (64 / 22) - 17) + ', ' + (-282 + y * (64 / 22) - 17) + ')',
      )
  }

  function circle(blip, x, y, order, group) {
    return (group || svg)
      .append('path')
      .attr(
        'd',
        'M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092',
      )
      .attr(
        'transform',
        'scale(' +
        blip.width / 34 +
        ') translate(' +
        (-404 + x * (34 / blip.width) - 17) +
        ', ' +
        (-282 + y * (34 / blip.width) - 17) +
        ')',
      )
      .attr('class', order)
  }

  function circleLegend(x, y, group) {
    return (group || svg)
      .append('path')
      .attr(
        'd',
        'M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092',
      )
      .attr(
        'transform',
        'scale(' + 22 / 64 + ') translate(' + (-404 + x * (64 / 22) - 17) + ', ' + (-282 + y * (64 / 22) - 17) + ')',
      )
  }

  function addRing(ring, order) {
    var table = d3.select('.quadrant-table.' + order)
    table.append('h3').text(ring)
    return table.append('ul')
  }

  function calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle) {
    var adjustX = Math.sin(toRadian(startAngle)) - Math.cos(toRadian(startAngle))
    var adjustY = -Math.cos(toRadian(startAngle)) - Math.sin(toRadian(startAngle))

    var radius = chance.floating({
      min: minRadius + blip.width / 2,
      max: maxRadius - blip.width / 2,
    })
    var angleDelta = (Math.asin(blip.width / 2 / radius) * 180) / (Math.PI - 1.25)
    angleDelta = angleDelta > 45 ? 45 : angleDelta
    var angle = toRadian(chance.integer({ min: angleDelta, max: 90 - angleDelta }))

    var x = center() + radius * Math.cos(angle) * adjustX
    var y = center() + radius * Math.sin(angle) * adjustY

    return [x, y]
  }

  function thereIsCollision(blip, coordinates, allCoordinates) {
    return allCoordinates.some(function (currentCoordinates) {
      return (
        Math.abs(currentCoordinates[0] - coordinates[0]) < blip.width &&
        Math.abs(currentCoordinates[1] - coordinates[1]) < blip.width
      )
    })
  }

  function plotBlips(quadrantGroup, rings, quadrantWrapper) {
    var blips, quadrant, startAngle, order

    quadrant = quadrantWrapper.quadrant
    startAngle = quadrantWrapper.startAngle
    order = quadrantWrapper.order

    d3.select('.quadrant-table.' + order)
      .append('h2')
      .attr('class', 'quadrant-table__name')
      .text(quadrant.name())

    blips = quadrant.blips()
    rings.forEach(function (ring, i) {
      var ringBlips = blips.filter(function (blip) {
        return blip.ring() === ring
      })

      if (ringBlips.length === 0) {
        return
      }

      var maxRadius, minRadius

      minRadius = ringCalculator.getRadius(i)
      maxRadius = ringCalculator.getRadius(i + 1)

      var sumRing = ring
        .name()
        .split('')
        .reduce(function (p, c) {
          return p + c.charCodeAt(0)
        }, 0)
      var sumQuadrant = quadrant
        .name()
        .split('')
        .reduce(function (p, c) {
          return p + c.charCodeAt(0)
        }, 0)
      chance = new Chance(Math.PI * sumRing * ring.name().length * sumQuadrant * quadrant.name().length)

      var ringList = addRing(ring.name(), order)
      var allBlipCoordinatesInRing = []

      ringBlips.forEach(function (blip) {
        //Check deleted flag and only render blips that have isDeleted set to false
        if (!blip.isDeleted()) {
          const coordinates = findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing)

          allBlipCoordinatesInRing.push(coordinates)
          drawBlipInCoordinates(blip, coordinates, order, quadrantGroup, ringList, quadrant.name())
        }
      })
    })
  }

  function findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing) {
    const maxIterations = 200
    var coordinates = calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle)
    var iterationCounter = 0
    var foundAPlace = false

    while (iterationCounter < maxIterations) {
      if (thereIsCollision(blip, coordinates, allBlipCoordinatesInRing)) {
        coordinates = calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle)
      } else {
        foundAPlace = true
        break
      }
      iterationCounter++
    }

    if (!foundAPlace && blip.width > MIN_BLIP_WIDTH) {
      blip.width = blip.width - 1
      return findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing)
    } else {
      return coordinates
    }
  }

  function drawBlipInCoordinates(blip, coordinates, order, quadrantGroup, ringList, quadrantName) {
    var x = coordinates[0]
    var y = coordinates[1]

    var group = quadrantGroup
      .append('g')
      .attr('class', 'blip-link')
      .attr('id', 'blip-link-' + blip.number())

    if (blip.isNew()) {
      triangle(blip, x, y, order, group)
    } else {
      circle(blip, x, y, order, group)
    }

    group
      .append('text')
      .attr('x', x)
      .attr('y', y + 4)
      .attr('class', 'blip-text')
      // derive font-size from current blip width
      .style('font-size', (blip.width * 10) / 22 + 'px')
      .attr('text-anchor', 'middle')
      .text(blip.number())

    var blipListItem = ringList.append('li')
    var blipText = blip.number() + '. ' + blip.name() + (blip.topic() ? '. - ' + blip.topic() : '')
    blipListItem
      .append('div')
      .attr('class', 'blip-list-item')
      .attr('id', 'blip-list-item-' + blip.number())
      .text(blipText)

    var blipItemDescription = blipListItem
      .append('div')
      .attr('id', 'blip-description-' + blip.number())
      .attr('class', 'blip-item-description')
      .style('display', 'block')
    //Blip description
    if (blip.description()) {
      blipItemDescription.append('p')
        .style('word-wrap', 'break-word')
        .style('overflow-y', 'hidden')
        .html(blip.description())
    }
    //Blip last updated timestamp
    if (blip.updatedAt()) {
      blipItemDescription.append('p')
        .attr('class', 'blip-updatedBy')
        .style('word-wrap', 'break-word')
        .style('border-top', '0px')
        .html('Last Updated: ' + new Date(Date.parse(blip.updatedAt())))
    }

    //Form that appears when edit is pressed
    var blipItemEditForm = blipListItem
      .append('div')
      .attr('id', 'blip-item-' + blip.number() + '-edit-form')
      .attr('class', 'blip-item-edit-form')
      .style('display', 'none')

    //Input for name
    var blipNameForm = blipItemEditForm
      .append('input')
      .attr('id', 'blip-item-' + blip.number() + '-edit-form-name')
      .attr('class', 'blip-item-edit-form-name')
      .attr('type', 'text')
      .attr('name', 'blipName')
      .attr('value', blip.name())

    var defaultRingOption = blip.ring().name().charAt(0) + blip.ring().name().slice(1).toLowerCase();

    //Input for ring
    var blipRingForm = blipItemEditForm
      .append('select')
      .attr('id', 'blip-item-' + blip.number() + '-edit-form-ring')
      .attr('class', 'blip-item-edit-form-ring')

    blipRingForm.selectAll('option')
      .data(ringOptions)
      .enter()
      .append('option')
      .property('selected', function (d) { return d === defaultRingOption; })
      .attr('value', function (d) {
        return d;
      })
      .text(function (d) {
        return d;
      });

    var defaultQuadrantOption = quadrantName;

    //Input for quadrant
    var blipQuadrantForm = blipItemEditForm
      .append('select')
      .attr('id', 'blip-item-' + blip.number() + '-edit-form-quadrant')
      .attr('class', 'blip-item-edit-form-quadrant')

    blipQuadrantForm.selectAll('option')
      .data(quadrantOptions)
      .enter()
      .append('option')
      .property('selected', function (d) { return d === defaultQuadrantOption; })
      .attr('value', function (d) {
        return d;
      })
      .text(function (d) {
        return d;
      });

    //Input for desc
    blipItemEditForm
      .append('input')
      .attr('id', 'blip-item-' + blip.number() + '-edit-form-desc')
      .attr('class', 'blip-item-edit-form-desc')
      .attr('type', 'text')
      .attr('name', 'blipDesc')
      .attr('value', blip.description() || '')

    //Input for isNew
    var isNewInput = blipItemEditForm
      .append('label')
      .text('isNew')
      .append('input')
      .attr('id', 'blip-item-' + blip.number() + '-edit-form-isNew')
      .attr('class', 'blip-item-edit-form-isNew')
      .attr('type', 'checkbox')

    if (blip.isNew()) {
      isNewInput.attr('checked', true);
    }

    //Cancel button for edit form
    blipItemEditForm
      .append('div')
      .attr('id', 'blip-cancel-' + blip.number())
      .attr('class', 'blip-item-cancel')
      .classed('button no-capitalize half', true)
      .text('Cancel')
      .style('display', 'none')
      .on('click', () => { clickEdit() })

    //Confirm button for edit form
    blipItemEditForm
      .append('div')
      .attr('id', 'blip-confirm-' + blip.number())
      .attr('class', 'blip-item-confirm')
      .classed('button no-capitalize half', true)
      .text('Confirm')
      .style('display', 'none')
      .on('click', () => { clickConfirm() })

    //Edit button in blip description
    blipItemDescription
      .append('div')
      .attr('id', 'blip-edit-' + blip.number())
      .attr('class', 'blip-item-edit')
      .classed('button no-capitalize half noprint', true)
      .style('margin-top', '4px')
      .style('margin-bottom', '10px')
      .text('Edit')
      .on('click', () => { clickEdit() })

    //Delete button in blip description
    blipItemDescription
      .append('div')
      .attr('id', 'blip-delete-' + blip.number())
      .attr('class', 'blip-item-delete')
      .classed('button no-capitalize half noprint', true)
      .style('margin-top', '4px')
      .style('margin-bottom', '10px')
      .text('Delete')
      .on('click', () => { clickDelete(blip._id()) })

    //History button in blip description
    blipItemDescription
      .append('div')
      .attr('id', 'blip-history-' + blip.number())
      .attr('class', 'blip-item-history')
      .classed('button no-capitalize half noprint', true)
      .style('margin-top', '4px')
      .style('margin-bottom', '10px')
      .text('History')
      .on('click', () => { clickHistory(blip._id()) })

    //Define within outer function level scope to be accessed
    var blipHistoryTableBody = undefined;

    //If blip history modal wrapper is not created yet
    if (!document.getElementById('blip-history-modal-wrapper')) {
      var blipHistoryModalWrapper = radarElement
        .append('div')
        .attr('id', 'blip-history-modal-wrapper')
        .classed('modal-wrapper', true)

      var blipHistoryModal = blipHistoryModalWrapper
        .append('div')
        .classed('modal', true)
        .style('width', '1000px')
        .attr('id', 'blip-history-modal')

      var blipHistoryModalButton = blipHistoryModal
        .append('button')
        .classed('modal-button', true)
        .style('left', '1000px')
        .attr('id', 'blip-history-modal-button')
        .on('click', () => { clickHistory() })

      blipHistoryModalButton
        .append('i')
        .classed('fa-solid fa-xmark', true)

      blipHistoryModal
        .append('h2')
        .html('Edit History')
        .classed('modal-title', true)

      var blipHistoryModalContent = blipHistoryModal
        .append('div')
        .classed('modal-content', true)
        .attr('id', 'blip-history-modal-content')

      var blipHistoryContainer = blipHistoryModalContent
        .append('div')
        .attr('id', 'blip-history-container')
        .classed('blip-history-container', true)

      var blipHistoryTable = blipHistoryContainer
        .append('table')

      var blipHistoryTableHead = blipHistoryTable
        .append('thead')
        .append('tr')

      blipHistoryTableHead
        .append('th')
        .html('Author')

      blipHistoryTableHead
        .append('th')
        .html('Field')

      blipHistoryTableHead
        .append('th')
        .html('Value')

      blipHistoryTableHead
        .append('th')
        .html('Action')

      blipHistoryTableHead
        .append('th')
        .html('Update Date')

      blipHistoryTableHead
        .append('th')

      blipHistoryTableBody = blipHistoryTable
        .append('tbody')
        .attr('id', 'blip-history-table-body')
        .classed('blip-history-table-body', true)
    }

    function clickHistory(blipId) {
      var content = document.getElementById('content');
      var modalWrapper = document.getElementById('blip-history-modal-wrapper');

      content.classList.toggle('modal--active');
      modalWrapper.classList.toggle('modal--active');

      var errorMessage = ''

      //Helper function to ensure that DOM element loads before JS is executed
      function waitFor(selector) {
        return new Promise(function (res, rej) {
          waitForElementToDisplay(selector, 200);
          function waitForElementToDisplay(selector, time) {
            if (document.querySelector(selector) != null) {
              res(document.querySelector(selector));
            }
            else {
              setTimeout(function () {
                waitForElementToDisplay(selector, time);
              }, time);
            }
          }
        });
      }

      if (blipId) {
        waitFor('.blip-history-table-body').then((res, rej) => {
          var blipHistoryTableBody = res
          blipHistoryTableBody.innerHTML = ''
        })

        d3.json(SERVER_URL + 'blip/viewBlipHistory/' + blipId, {
          method: 'GET',
          headers: {},
        }).then((data) => {
          populateTable(data)
        }).catch(err => {
          errorMessage = err.message;
          alert(errorMessage)
        }).finally(() => {
          if (!errorMessage || !errorMessage.isEmpty()) {
          }
        });
      }

      var populateTable = function (data) {

        //Create row in table for every change that happened so far in history (one row per change)
        data.history.slice().reverse().forEach((value, index1, array) => {
          value.changes.forEach((changeValue, index2, array) => {
            let tr = document.createElement('tr')
            tr.setAttribute('id', 'blip-history-row-' + index1 + '-' + index2)
            tr.classList.add('blip-history-row-' + index1 + '-' + index2)

            waitFor('.blip-history-table-body').then((res, rej) => {
              var blipHistoryTableBody = res
              blipHistoryTableBody
                .append(tr)
            })
          })

          value.changes.forEach((changeValue, index3, array) => {
            waitFor('.blip-history-row-' + index1 + '-' + index3).then((res, rej) => {
              var curRow = res
              let authorColumn = document.createElement('td')
              authorColumn.innerHTML = value.author

              let fieldColumn = document.createElement('td')
              fieldColumn.innerHTML = changeValue.field

              let valueColumn = document.createElement('td')
              valueColumn.innerHTML = changeValue.value

              let actionColumn = document.createElement('td')
              actionColumn.innerHTML = value.action

              let dateColumn = document.createElement('td')
              dateColumn.innerHTML = convertTZ(value.updatedAt)

              let buttonColumn = document.createElement('td')
              buttonColumn.style.verticalAlign = 'middle'

              let rollbackButton = document.createElement('button')
              rollbackButton.innerHTML = 'Rollback'
              rollbackButton.type = 'submit'
              rollbackButton.classList.add('button', 'no-capitalize')
              rollbackButton.onclick = () => { restoreVersion() }

              buttonColumn.append(rollbackButton)

              var columns = [authorColumn, fieldColumn, valueColumn, actionColumn, dateColumn]

              columns.forEach((value) => {
                curRow.append(value);
                if (index3 == 0) {
                  curRow.append(buttonColumn)
                }
              })
            })

          })

          var restoreVersion = function () {
            var errorMessage;
            d3.json(SERVER_URL + 'blip/rollbackBlip/' + blipId + '/' + value._id + '/admin',
              { method: 'POST' }
            ).catch(err => {
              errorMessage = err.message;
              alert(errorMessage);
            }).finally(() => {
              if (!errorMessage || !errorMessage.isEmpty())
                window.location.reload();
            });
          }
        })
      }

    }

    function clickDelete(blipId) {

      var errorMessage = '';

      //Soft Delete (Hide)
      d3.json(SERVER_URL + 'blip/hideBlip/' + blipId + '/admin', {
        method: 'POST',
        headers: {},
      }).catch(err => {
        errorMessage = err.message;
      }).finally(() => {
        if (!errorMessage || !errorMessage.isEmpty())
          window.location.reload();
      });
    }

    var mouseOver = function () {
      d3.selectAll('g.blip-link').attr('opacity', 0.3)
      group.attr('opacity', 1.0)
      blipListItem.selectAll('.blip-list-item').classed('highlight', true)
      tip.show(blip.name(), group.node())
    }

    var mouseOut = function () {
      d3.selectAll('g.blip-link').attr('opacity', 1.0)
      blipListItem.selectAll('.blip-list-item').classed('highlight', false)
      tip.hide().style('left', 0).style('top', 0)
    }

    blipListItem.on('mouseover', mouseOver).on('mouseout', mouseOut)
    group.on('mouseover', mouseOver).on('mouseout', mouseOut)

    var previousEditButton = null;
    var previousDeleteButton = null;

    var clickBlip = function () {
      d3.select('.blip-item-description.expanded').node() !== blipItemDescription.node() &&
        d3.select('.blip-item-description.expanded').classed('expanded', false)
      blipItemDescription.classed('expanded', !blipItemDescription.classed('expanded'))

      var editButton = document.getElementById('blip-edit-' + blip.number());
      var deleteButton = document.getElementById('blip-delete-' + blip.number());

      if (previousEditButton) {
        previousEditButton.style.display = 'none';
        previousDeleteButton.style.display = 'none';
      }

      if (editButton.style.display === 'inline-block') {
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';
      } else {
        editButton.style.display = 'inline-block';
        deleteButton.style.display = 'inline-block';
      }

      previousEditButton = editButton;
      previousDeleteButton = deleteButton;

      blipItemDescription.on('click', function (e) {
        e.stopPropagation()
      })
      blipNameForm.on('click', function (e) {
        e.stopPropagation()
      })
    }

    var blipItem = document.getElementById('blip-item-' + blip.number() + '-edit-form');
    var cancelButton = document.getElementById('blip-cancel-' + blip.number());
    var submitButton = document.getElementById('blip-confirm-' + blip.number());
    var description = document.getElementById('blip-description-' + blip.number());

    function clickEdit() {

      if (!(blipItem.style.display) || blipItem.style.display != 'block') {
        blip.editTimeStart = new Date();
        blipItem.style.display = 'block';
        cancelButton.style.display = 'inline-block';
        submitButton.style.display = 'inline-block';
        description.style.display = 'none';

      } else {
        blip.editTimeStart = null;
        blipItem.style.display = 'none';
        cancelButton.style.display = 'none';
        submitButton.style.display = 'none';
        description.style.display = 'block';
      }

      blipListItem.on('click', function (e) {
        e.stopPropagation()
      })
      setTimeout(() => { blipListItem.on('click', clickBlip); }, 1);

    }

    function convertTZ(date, tzString) {
      return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
    }

    function clickConfirm() {
      var editedName = document.getElementById('blip-item-' + blip.number() + '-edit-form-name').value;
      var editedRing = document.getElementById('blip-item-' + blip.number() + '-edit-form-ring').value.toLowerCase();
      var editedQuadrant = document.getElementById('blip-item-' + blip.number() + '-edit-form-quadrant').value.toLowerCase();
      var editedDescription = document.getElementById('blip-item-' + blip.number() + '-edit-form-desc').value;
      var editedIsNew = document.getElementById('blip-item-' + blip.number() + '-edit-form-isNew').checked.toString().toUpperCase();

      var errorMessage = '';

      var validateAndPost = function (res) {

        if (res.isDeleted) {
          alert('Blip was deleted during editing time, preventing update');
        }
        else if (res.updatedAt && blip.editTimeStart < convertTZ(res.updatedAt)) {
          alert('Blip information was updated during editing time, please submit again if you want to confirm edit');
          console.log(blip.editTimeStart);
          blip.editTimeStart = new Date();
        }
        else
          d3.json(SERVER_URL + 'blip/updateBlip/' + blip._id() + '/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: editedName,
              ring: editedRing,
              quadrant: editedQuadrant,
              isNew: editedIsNew,
              description: editedDescription
            })
          }).catch(err => {
            console.log(err.message);
            errorMessage = err.message;
          }).finally(() => {
            if (errorMessage === '')
              window.location.reload();
            clickBlip;
          });
      }


      d3.json(SERVER_URL + 'blip/viewBlip/' + blip._id())
        .then(validateAndPost);

    }

    blipListItem.on('click', clickBlip)
  }

  function removeHomeLink() {
    d3.select('.home-link').remove()
  }

  function createHomeLink(pageElement) {
    if (pageElement.select('.home-link').empty()) {
      pageElement
        .insert('div', 'div#alternative-buttons')
        .html('&#171; Back to Radar home')
        .classed('home-link', true)
        .classed('selected', true)
        .on('click', redrawFullRadar)
        .append('g')
        .attr('fill', '#626F87')
        .append('path')
        .attr(
          'd',
          'M27.6904224,13.939279 C27.6904224,13.7179572 27.6039633,13.5456925 27.4314224,13.4230122 L18.9285959,6.85547454 C18.6819796,6.65886965 18.410898,6.65886965 18.115049,6.85547454 L9.90776939,13.4230122 C9.75999592,13.5456925 9.68592041,13.7179572 9.68592041,13.939279 L9.68592041,25.7825947 C9.68592041,25.979501 9.74761224,26.1391059 9.87092041,26.2620876 C9.99415306,26.3851446 10.1419265,26.4467108 10.3145429,26.4467108 L15.1946918,26.4467108 C15.391698,26.4467108 15.5518551,26.3851446 15.6751633,26.2620876 C15.7984714,26.1391059 15.8600878,25.979501 15.8600878,25.7825947 L15.8600878,18.5142424 L21.4794061,18.5142424 L21.4794061,25.7822933 C21.4794061,25.9792749 21.5410224,26.1391059 21.6643306,26.2620876 C21.7876388,26.3851446 21.9477959,26.4467108 22.1448776,26.4467108 L27.024951,26.4467108 C27.2220327,26.4467108 27.3821898,26.3851446 27.505498,26.2620876 C27.6288061,26.1391059 27.6904224,25.9792749 27.6904224,25.7822933 L27.6904224,13.939279 Z M18.4849735,0.0301425662 C21.0234,0.0301425662 23.4202449,0.515814664 25.6755082,1.48753564 C27.9308469,2.45887984 29.8899592,3.77497963 31.5538265,5.43523218 C33.2173918,7.09540937 34.5358755,9.05083299 35.5095796,11.3015031 C36.4829061,13.5518717 36.9699469,15.9439104 36.9699469,18.4774684 C36.9699469,20.1744196 36.748098,21.8101813 36.3044755,23.3844521 C35.860551,24.9584216 35.238498,26.4281731 34.4373347,27.7934053 C33.6362469,29.158336 32.6753041,30.4005112 31.5538265,31.5197047 C30.432349,32.6388982 29.1876388,33.5981853 27.8199224,34.3973401 C26.4519041,35.1968717 24.9791531,35.8176578 23.4016694,36.2606782 C21.8244878,36.7033971 20.1853878,36.9247943 18.4849735,36.9247943 C16.7841816,36.9247943 15.1453837,36.7033971 13.5679755,36.2606782 C11.9904918,35.8176578 10.5180429,35.1968717 9.15002449,34.3973401 C7.78223265,33.5978839 6.53752245,32.6388982 5.41612041,31.5197047 C4.29464286,30.4005112 3.33339796,29.158336 2.53253673,27.7934053 C1.73144898,26.4281731 1.10909388,24.9584216 0.665395918,23.3844521 C0.22184898,21.8101813 0,20.1744196 0,18.4774684 C0,16.7801405 0.22184898,15.1446802 0.665395918,13.5704847 C1.10909388,11.9962138 1.73144898,10.5267637 2.53253673,9.16153157 C3.33339796,7.79652546 4.29464286,6.55435031 5.41612041,5.43523218 C6.53752245,4.3160387 7.78223265,3.35675153 9.15002449,2.55752138 C10.5180429,1.75806517 11.9904918,1.13690224 13.5679755,0.694183299 C15.1453837,0.251464358 16.7841816,0.0301425662 18.4849735,0.0301425662 L18.4849735,0.0301425662 Z',
        )
    }
  }

  function removeRadarLegend() {
    d3.select('.legend').remove()
  }

  function drawLegend(order) {
    removeRadarLegend()

    var triangleKey = 'New or moved'
    var circleKey = 'No change'

    var container = d3
      .select('svg')
      .append('g')
      .attr('class', 'legend legend' + '-' + order)

    var x = 10
    var y = 10

    if (order === 'first') {
      x = (4 * size) / 5
      y = (1 * size) / 5
    }

    if (order === 'second') {
      x = (1 * size) / 5 - 15
      y = (1 * size) / 5 - 20
    }

    if (order === 'third') {
      x = (1 * size) / 5 - 15
      y = (4 * size) / 5 + 15
    }

    if (order === 'fourth') {
      x = (4 * size) / 5
      y = (4 * size) / 5
    }

    d3.select('.legend')
      .attr('class', 'legend legend-' + order)
      .transition()
      .style('visibility', 'visible')

    triangleLegend(x, y, container)

    container
      .append('text')
      .attr('x', x + 15)
      .attr('y', y + 5)
      .attr('font-size', '0.8em')
      .text(triangleKey)

    circleLegend(x, y + 20, container)

    container
      .append('text')
      .attr('x', x + 15)
      .attr('y', y + 25)
      .attr('font-size', '0.8em')
      .text(circleKey)
  }

  function redrawFullRadar() {
    removeHomeLink()
    removeRadarLegend()
    tip.hide()
    d3.selectAll('g.blip-link').attr('opacity', 1.0)

    svg.style('left', 0).style('right', 0)

    d3.selectAll('.button').classed('selected', false).classed('full-view', true)

    d3.selectAll('.quadrant-table').classed('selected', false)
    d3.selectAll('.home-link').classed('selected', false)

    d3.selectAll('.quadrant-group').transition().duration(ANIMATION_DURATION).attr('transform', 'scale(1)')

    d3.selectAll('.quadrant-group .blip-link').transition().duration(ANIMATION_DURATION).attr('transform', 'scale(1)')

    d3.selectAll('.quadrant-group').style('pointer-events', 'auto')
  }

  function searchBlip(_e, ui) {
    const { blip, quadrant } = ui.item
    const isQuadrantSelected = d3.select('div.button.' + quadrant.order).classed('selected')
    selectQuadrant.bind({}, quadrant.order, quadrant.startAngle)()
    const selectedDesc = d3.select('#blip-description-' + blip.number())
    d3.select('.blip-item-description.expanded').node() !== selectedDesc.node() &&
      d3.select('.blip-item-description.expanded').classed('expanded', false)
    selectedDesc.classed('expanded', true)

    d3.selectAll('g.blip-link').attr('opacity', 0.3)
    const group = d3.select('#blip-link-' + blip.number())
    group.attr('opacity', 1.0)
    d3.selectAll('.blip-list-item').classed('highlight', false)
    d3.select('#blip-list-item-' + blip.number()).classed('highlight', true)
    if (isQuadrantSelected) {
      tip.show(blip.name(), group.node())
    } else {
      // need to account for the animation time associated with selecting a quadrant
      tip.hide()

      setTimeout(function () {
        tip.show(blip.name(), group.node())
      }, ANIMATION_DURATION)
    }
  }

  function plotRadarHeader() {
    header = d3.select('body').insert('header', '#radar')
    header
      .append('div')
      .attr('class', 'radar-title')
      .append('div')
      .attr('class', 'radar-title__text')
      .append('h1')
      .text(document.title)
      .style('cursor', 'pointer')
      .on('click', redrawFullRadar)

    header
      .select('.radar-title')
      .append('div')
      .attr('class', 'radar-title__logo')
      .html('<a href="https://www.thoughtworks.com"> <img src="/images/logo.png" /> </a>')

    buttonsGroup = header.append('div').classed('buttons-group', true)

    quadrantButtons = buttonsGroup.append('div').classed('quadrant-btn--group', true)

    utilityButtons = buttonsGroup.append('div').classed('utility-btn--group', true)

    alternativeDiv = header.append('div').attr('id', 'alternative-buttons')

    return header
  }

  function plotHeader() {
    document.querySelector('.hero-banner__title-text').innerHTML = document.title
    const radarWrapper = d3.select('main .graph-placeholder')
    document.querySelector('.hero-banner__title-text').addEventListener('click', redrawFullRadar)

    d3.select('.hero-banner__wrapper').append('div').classed('foreword', true).html('powered by EFT Team')

    buttonsGroup = radarWrapper.append('div').classed('buttons-group', true)

    quadrantButtons = buttonsGroup.append('div').classed('quadrant-btn--group', true)

    utilityButtons = buttonsGroup.append('div').classed('utility-btn--group', true)

    alternativeDiv = radarWrapper.append('div').attr('id', 'alternative-buttons')

    return radarWrapper
  }

  function plotQuadrantButtons(quadrants) {
    function addButton(quadrant) {
      radarElement.append('div').attr('class', 'quadrant-table ' + quadrant.order)

      quadrantButtons
        .append('div')
        .attr('class', 'button ' + quadrant.order + ' full-view')
        .attr('id', 'quadrant-' + quadrant.quadrant.name() + '-button')
        .text(quadrant.quadrant.name())
        .on('mouseover', mouseoverQuadrant.bind({}, quadrant.order))
        .on('mouseout', mouseoutQuadrant.bind({}, quadrant.order))
        .on('click', selectQuadrant.bind({}, quadrant.order, quadrant.startAngle))
    }

    _.each([0, 1, 2, 3], function (i) {
      addButton(quadrants[i])
    })

    utilityButtons
      .append('div')
      .classed('print-radar-btn', true)
      .append('div')
      .classed('print-radar button print no-capitalize', true)
      .text('Deleted Blips History')
      .on('click', () => { deletedBlipsButtonClick() })


    //Deleted Blips Modal
    var deletedBlipsModalWrapper = radarElement
      .append('div')
      .attr('id', 'deleted-blips-modal-wrapper')
      .classed('modal-wrapper', true)

    var deletedBlipsModal = deletedBlipsModalWrapper
      .append('div')
      .classed('modal', true)
      .style('width', '800px')
      .attr('id', 'deleted-blips-modal')

    var deletedBlipsModalButton = deletedBlipsModal
      .append('button')
      .classed('modal-button', true)
      // .style('left', '800px')
      .attr('id', 'deleted-blips-modal-button')
      .on('click', () => { deletedBlipsButtonClick() })

    deletedBlipsModalButton
      .append('i')
      .classed('fa-solid fa-xmark', true)

    deletedBlipsModal
      .append('h2')
      .html('Deleted Blips')
      .classed('modal-title', true)

    var deletedBlipsModalContent = deletedBlipsModal
      .append('div')
      .classed('modal-content', true)
      .attr('id', 'deleted-blips-modal-content')

    var deletedBlipsContainer = deletedBlipsModalContent
      .append('div')
      .attr('id', 'deleted-blips-container')
      .classed('deleted-blips-container', true)

    var deletedBlipsTable = deletedBlipsContainer
      .append('table')

    var deletedBlipsTableHead = deletedBlipsTable
      .append('thead')
      .append('tr')

    deletedBlipsTableHead
      .append('th')
      .html('Name')

    deletedBlipsTableHead
      .append('th')
      .html('Removal Date')

    deletedBlipsTableHead
      .append('th')

    var deletedBlipsTableBody = deletedBlipsTable
      .append('tbody')
      .attr('id', 'deleted-blips-table-body')


    function deletedBlipsButtonClick() {
      var content = document.getElementById('content');
      var modalWrapper = document.getElementById('deleted-blips-modal-wrapper');

      if (!selectState) {
        content.classList.toggle('modal--active');
        modalWrapper.classList.toggle('modal--active');

        d3.json(SERVER_URL + 'blip/viewAllDeletedBlips').then((data) => { populateTable(data) })
      }

      var populateTable = function (data) {
        try {
          var columnNames = Object.keys(data[0])
          var contentValidator = new ContentValidator(columnNames)
          contentValidator.verifyContent()
          contentValidator.verifyHeaders()
          var blips = _.map(data, new InputSanitizer().sanitize)

          document.getElementById('deleted-blips-table-body').innerHTML = '';

          blips.forEach(blip => {
            var curRow = deletedBlipsTableBody
              .append('tr')

            curRow
              .append('td')
              .style('word-wrap', 'anywhere')
              .html(blip.name)

            curRow
              .append('td')
              .html(new Date(Date.parse(blip.updatedAt)))
            //.html(blip.updatedAt.substring(0, 10) + ' ' + (parseInt(blip.updatedAt.substring(11, 13)) + 8) + blip.updatedAt.substring(13, 19))

            curRow
              .append('td')
              .style('vertical-align', 'middle')
              .append('button')
              .classed('button no-capitalize', true)
              .on('click', () => { restoreBlip() })
              .html('restore')

            curRow
              .append('td')
              .style('vertical-align', 'middle')
              .append('button')
              .classed('button no-capitalize', true)
              .on('click', () => { removeBlip() })
              .html('remove')

            var restoreBlip = function () {
              var errorMessage;
              d3.json(SERVER_URL + 'blip/restoreBlip/' + blip._id + '/admin',
                { method: 'POST' }
              ).catch(err => {
                errorMessage = err.message;
                alert(errorMessage);
              }).finally(() => {
                if (!errorMessage || !errorMessage.isEmpty())
                  window.location.reload();
              });
            }

            var removeBlip = function () {
              var errorMessage;
              d3.json(SERVER_URL + 'blip/deleteBlip/' + blip._id, {
                method: 'DELETE',
                headers: {},
              }).catch(err => {
                errorMessage = err.message;
              }).finally(() => {
                if (!errorMessage || !errorMessage.isEmpty())
                  window.location.reload();
              });
            }
          });

        } catch (exception) {
          console.log(exception);
        }
      }
    }


    var createBlipButton = utilityButtons
      .append('div')
      .classed('create-blip-btn', true)

    createBlipButton
      .append('div')
      .attr('id', 'myBtn')
      .classed('button create no-capitalize', true)
      .text('Create new blip')
      .on('click', () => { createBlipButtonClick() })

    var selectState = false;

    //Create Blip Modal
    var modalWrapper = radarElement
      .append('div')
      .attr('id', 'modal-wrapper')
      .classed('modal-wrapper', true)

    var modal = modalWrapper
      .append('div')
      .classed('modal', true)
      .attr('id', 'modal')

    var modalButton = modal
      .append('button')
      .classed('modal-button', true)
      .attr('id', 'modal-button')
      .on('click', () => { createBlipButtonClick() })

    modalButton
      .append('i')
      .classed('fa-solid fa-xmark', true)

    modal
      .append('h2')
      .html('Create New Blip')
      .classed('modal-title', true)

    d3.select('main')
      .classed('content', true)
      .attr('id', 'content')

    var modalContent = modal
      .append('div')
      .classed('modal-content', true)
      .attr('id', 'modal-content')

    var createBlipContainer = modalContent
      .append('div')
      .attr('id', 'create-blip-container')
      .classed('create-blip-container', true)

    //name field
    createBlipContainer
      .append('input')
      .attr('id', 'create-blip-name')
      .attr('class', 'create-blip-name')
      .attr('type', 'text')
      .attr('name', 'blipName')
      .attr('placeholder', 'Blip Name')

    //ring field
    var blipRingForm = createBlipContainer
      .append('select')
      .attr('id', 'create-blip-ring')
      .attr('class', 'create-blip-ring')
      .on('mouseenter', () => { selectState = true })
      .on('mouseleave', () => { selectState = false })

    blipRingForm.selectAll('option')
      .data(ringOptions)
      .enter()
      .append('option')
      .attr('value', function (d) {
        return d;
      })
      .text(function (d) {
        return d;
      });

    //quadrant field
    var blipQuadrantForm = createBlipContainer
      .append('select')
      .attr('id', 'create-blip-quadrant')
      .attr('class', 'create-blip-quadrant')
      .on('mouseenter', () => { selectState = true })
      .on('mouseleave', () => { selectState = false })

    blipQuadrantForm.selectAll('option')
      .data(quadrantOptions)
      .enter()
      .append('option')
      .attr('value', function (d) {
        return d;
      })
      .text(function (d) {
        return d;
      });

    //desc field
    createBlipContainer
      .append('input')
      .attr('id', 'create-blip-desc')
      .attr('class', 'create-blip-desc')
      .attr('type', 'text')
      .attr('name', 'blipDesc')
      .attr('placeholder', 'Description')

    //isNew field
    createBlipContainer
      .append('label')
      .style('margin-left', '16px')
      .text('isNew')
      .append('input')
      .attr('id', 'create-blip-isNew')
      .attr('class', 'create-blip-isNew')
      .attr('type', 'checkbox')


    //confirm button
    createBlipContainer
      .append('div')
      .attr('id', 'create-blip-confirm')
      .attr('class', 'create-blip-confirm')
      .classed('button no-capitalize half', true)
      .text('Confirm')
      .on('click', () => { clickConfirm() })

    //createBlipContainer.on('mouseout', () => { createBlipButtonClick() });


    alternativeDiv
      .append('div')
      .classed('search-box', true)
      .append('input')
      .attr('id', 'auto-complete')
      .attr('placeholder', 'Search')
      .classed('search-radar', true)

    AutoComplete('#auto-complete', quadrants, searchBlip)

    function createBlipButtonClick() {
      var content = document.getElementById('content');
      var modalWrapper = document.getElementById('modal-wrapper');

      if (!selectState) {
        content.classList.toggle('modal--active');
        modalWrapper.classList.toggle('modal--active');
      }
    }

    function clickConfirm() {
      var name = document.getElementById('create-blip-name').value;
      var ring = document.getElementById('create-blip-ring').value.toLowerCase();
      var quadrant = document.getElementById('create-blip-quadrant').value.toLowerCase();
      var description = document.getElementById('create-blip-desc').value;
      var isNew = document.getElementById('create-blip-isNew').checked.toString().toUpperCase();
      var errorMessage = '';

      var dataLog = function (res) {
        console.log(res);
      }

      d3.json(SERVER_URL + 'blip/createBlip/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ring,
          quadrant,
          isNew,
          description
        })
      }).then(dataLog
      )
        .catch(err => {
          errorMessage = err.message;
          alert(errorMessage);
        }).finally(() => {
          if (errorMessage.length === 0)
            window.location.reload();

        });
    }
    //############################## Insert from xlsx ###########################
    var addBlipsFromExcel = utilityButtons
    .append('div')
    .classed('print-radar-btn', true) //reusing print btn class for ui consistency

    addBlipsFromExcel
    .append('div')
    .classed('button abc no-capitalize', true)
    .text('Upload Excel')
    .on('click', () => { addBlipsFromExcelButtonClick() })

    var selectState = false;

    var addBlipsExcelModalWrapper = radarElement
    .append('div')
    .attr('id', 'add-blips-modal-wrapper')
    .classed('modal-wrapper', true)

    var addBlipsExcelmodal = addBlipsExcelModalWrapper
      .append('div')
      .classed('modal', true)
      .style('width', '70%')
      .attr('id', 'add-blips-modal')

  var addBlipsExcelModalButton = addBlipsExcelmodal
    .append('button')
    .classed('modal-button', true)
    .style('right', '30px')
    .attr('id', 'add-blips-modal-button')
    .on('click', () => { addBlipsFromExcelButtonClick() })
    addBlipsExcelModalButton
    .append('i')
    .classed('fa-solid fa-xmark', true)

    var tooltip = addBlipsExcelmodal
    .append('h2')
    .html('Upload excel for multiple blips ⓘ')
    .classed('tooltip', true)

      tooltip.append('span')
      .html(`Ensure that the excel file contains one sheet and has
      has the following mandatory columns as headers: <br>name | ring | quadrant | isNew | description <br>
      <br>*any additional columns can be left in the excelsheet but will not be used. <br>
      *mandatory columns do not have to be in any particular order `).classed('tooltiptext',true)



  d3.select('main')
    .classed('content', true)
    .attr('id', 'content')

  var addBlipsModalContent = addBlipsExcelmodal
    .append('div')
    .classed('modal-content', true)
    .attr('id', 'modal-content')

  var addBlipContainer = addBlipsModalContent
    .append('div')
    .attr('id', 'add-blip-container')
    .classed('add-blip-container', true)


    // createBlipContainer
    // .append('div')
    // .attr('id', 'add-blip-upload')
    // .attr('class', 'add-blip-upload')
    // .classed('button no-capitalize half', true)
    // .text('upload file')
    // .on('click', () => { uploadFile() })
    // addBlipContainer
    // .append('div')
    // .attr('id', 'add-blip-upload')
    // .attr('class', 'add-blip-upload')
    // .classed('button no-capitalize half', true)
    // .text('upload file')
    // .on('click', () => { uploadFile() })
    addBlipContainer
    .append('div')
    .attr('id', 'add-blip-upload-box')
    .attr('class', 'droparea')
    .text('Drop the .xls / .xlsx / .csv here')

    var uploadBlipsContainer = addBlipsModalContent
    .append('div')
    .attr('id', 'upload-blip-container')
    .classed('upload-blip-container', true);

    var uploadBlipsTitle = uploadBlipsContainer
    .append('h3')
    .html('Sample input insertion')
    .attr('id', 'upload-blips-modal-title')
    .classed('upload-blips-modal-title', true);


    //functions
    //== addblip
    function addBlipsFromExcelButtonClick() {
      var content = document.getElementById('content');
      var modalWrapper = document.getElementById('add-blips-modal-wrapper');

      if (!selectState) {
        content.classList.toggle('modal--active');
        modalWrapper.classList.toggle('modal--active');
      }
    }

    //== send file
    var dataLog = function (res) {
      console.log(res);
    }
    function sendFile(rowObject){
      d3.json(SERVER_URL + 'blip/createBlips/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:JSON.stringify(rowObject)
      }).then(() => {window.location.reload();return dataLog();}
      )
        .catch(err => {
          errorMessage = err.message;
          alert(errorMessage);
        }).finally(() => {
          if (errorMessage.length === 0)
            window.location.reload();
        });
    }
    //== upload file

    function uploadSubmitBtn(rowObject){
      if (document.getElementById('add-blip-upload-btn') != null){

      }else{
        addBlipContainer
          .append('div')
          .attr('id', 'add-blip-upload-btn')
          .attr('class', 'add-blip-upload-btn')
          .classed('button no-capitalize half', true)
          .text('upload file')
          .on('click', () => { sendFile(rowObject) })
        }
    }


    //== drag&drop UI function
    const droparea = document.querySelector(".droparea");

    droparea.addEventListener("dragover", (e) => {
      e.preventDefault();
      droparea.classList.add("hover");
    });

    droparea.addEventListener("dragleave", () => {
      droparea.classList.remove("hover");
    });

    droparea.addEventListener("drop", (e) => {
      e.preventDefault();

      const file_input = e.dataTransfer.files[0];
      // console.log(file_input)
      const type = file_input.type;

      if (
        type == "text/csv" ||
        type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        type == "application/vnd.ms-excel"
        //csv , xlsx , xls

      ) {
        droparea.setAttribute("class", "droparea valid");
        droparea.innerText = "Added " + file_input.name;
        return upload(file_input);
      } else {
        droparea.setAttribute("class", "droparea invalid");
        droparea.innerText = "Invalid File Format!";
        var uploadBlipContainer = document.getElementById('upload-blip-container');
        uploadBlipContainer.classList.toggle('upload-blip-container--active',false);
        document.getElementById('upload-blip-container').innerHTML = '';
        var element = document.getElementById("add-blip-upload-btn");
        element.parentNode.removeChild(element);
        // document.getElementById('upload-blip-container').innerHTML ='';
        //   document.getElementById("add-blip-upload").remove();
        // document.getElementsByClassName('upload-blips-modal-title').remove();
        return false;
      }
    });
    // droparea.setAttribute("class", "droparea valid");
    // droparea.innerText = "Added " + file_input.name;
    const upload = (file_input) => {

      var uploadBlipContainer = document.getElementById('upload-blip-container');
      uploadBlipContainer.classList.toggle('upload-blip-container--active',true);




      let fileReader = new FileReader();
      fileReader.readAsBinaryString(file_input);
      fileReader.onload = (event)=>{
       let data = event.target.result;
       let workbook = XLSX.read(data,{type:"binary"});
      //  console.log("====== work book =======")
      //  console.log(workbook);
       workbook.SheetNames.forEach(sheet => {
            let rowObject = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
            var htmlstr = XLSX.write(workbook,{name:sheet,type:'binary',bookType:'html'});

            // console.log(uploadBlipsContainer)
            document.getElementById('upload-blip-container').innerHTML += htmlstr;
            //create a upload submit button
            uploadSubmitBtn(rowObject);



       });
      }
    };
       //############################## Guide feature ###########################
    //    var guideFeature = utilityButtons
    //    .append('div')
    //    .classed('print-radar-btn', true) //reusing print btn class for ui consistency

    //    guideFeature
    //    .append('div')
    //    .classed('button abc no-capitalize', true)
    //    .text('Guide')
    //    .on('click', () => { guideFeatureButtonClick() })

    //    var selectState = false;

    //    var guideFeatureModalWrapper = radarElement
    //    .append('div')
    //    .attr('id', 'guide-feature-modal-wrapper')
    //    .classed('modal-wrapper', true)

    //    var guideFeatureModal = guideFeatureModalWrapper
    //      .append('div')
    //      .classed('modal', true)
    //      .style('width', '70%')
    //      .attr('id', 'guide-feature-modal')

    //  var guideFeatureModalButton = guideFeatureModal
    //    .append('button')
    //    .classed('modal-button', true)
    //    .style('right', '30px')
    //    .attr('id', 'guide-feature-modal-button')
    //    .on('click', () => { guideFeatureButtonClick() })
    //    guideFeatureModalButton
    //    .append('i')
    //    .classed('fa-solid fa-xmark', true)

    //    guideFeatureModal
    //    .append('h2')
    //    .html('FAQ')
    //    .classed('modal-title', true)

    //  d3.select('main')
    //    .classed('content', true)
    //    .attr('id', 'content')

    //  var guideFeatureModalContent = guideFeatureModal
    //    .append('div')
    //    .classed('modal-content', true)
    //    .attr('id', 'modal-content')

    //  var guideFeatureContainer = guideFeatureModalContent
    //    .append('div')
    //    .attr('id', 'guide-feature-container')
    //    .classed('guide-feature-container', true)

    //    function guideFeatureButtonClick() {
    //     var content = document.getElementById('content');
    //     var modalWrapper = document.getElementById('guide-feature-modal-wrapper');

    //     if (!selectState) {
    //       content.classList.toggle('modal--active');
    //       modalWrapper.classList.toggle('modal--active');
    //     }
    //   }

    //######################## end of guide feature button ############
  }

  function plotRadarFooter() {
    d3.select('body')
      .insert('div', '#radar-plot + *')
      .attr('id', 'footer')
      .append('div')
      .attr('class', 'footer-content')
      .append('p')
      .html(
        'Powered by <a href="https://www.thoughtworks.com"> Thoughtworks</a>. ' +
        'By using this service you agree to <a href="https://www.thoughtworks.com/radar/tos">Thoughtworks\' terms of use</a>. ' +
        'You also agree to our <a href="https://www.thoughtworks.com/privacy-policy">privacy policy</a>, which describes how we will gather, use and protect any personal data contained in your public Google Sheet. ' +
        'This software is <a href="https://github.com/thoughtworks/build-your-own-radar">open source</a> and available for download and self-hosting.',
      )
  }

  function mouseoverQuadrant(order) {
    d3.select('.quadrant-group-' + order).style('opacity', 1)
    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 0.3)
  }

  function mouseoutQuadrant(order) {
    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 1)
  }

  function selectQuadrant(order, startAngle) {
    d3.selectAll('.home-link').classed('selected', false)
    createHomeLink(d3.select('main .graph-placeholder'))

    d3.selectAll('.button').classed('selected', false).classed('full-view', false)
    d3.selectAll('.button.' + order).classed('selected', true)
    d3.selectAll('.quadrant-table').classed('selected', false)
    d3.selectAll('.quadrant-table.' + order).classed('selected', true)
    d3.selectAll('.blip-item-description').classed('expanded', false)

    var scale = 2

    var adjustX = Math.sin(toRadian(startAngle)) - Math.cos(toRadian(startAngle))
    var adjustY = Math.cos(toRadian(startAngle)) + Math.sin(toRadian(startAngle))

    var translateX = ((-1 * (1 + adjustX) * size) / 2) * (scale - 1) + -adjustX * (1 - scale / 2) * size
    var translateY = -1 * (1 - adjustY) * (size / 2 - 7) * (scale - 1) - ((1 - adjustY) / 2) * (1 - scale / 2) * size

    var translateXAll = (((1 - adjustX) / 2) * size * scale) / 2 + ((1 - adjustX) / 2) * (1 - scale / 2) * size
    var translateYAll = (((1 + adjustY) / 2) * size * scale) / 2

    var moveRight = ((1 + adjustX) * (0.8 * window.innerWidth - size)) / 2
    var moveLeft = ((1 - adjustX) * (0.8 * window.innerWidth - size)) / 2

    var blipScale = 3 / 4
    var blipTranslate = (1 - blipScale) / blipScale

    if (window.innerWidth > 600) {
      var left = -10;
      if (moveLeft > 0) {
        left = moveLeft - 5;
      }
      svg.style('left', left + 'px').style('right', moveRight + 'px')
    } else {
      svg.style('left', 0).style('right', 0)
    }

    d3.select('.quadrant-group-' + order)
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('transform', 'translate(' + translateX + ',' + translateY + ')scale(' + scale + ')')
    d3.selectAll('.quadrant-group-' + order + ' .blip-link text').each(function () {
      var x = d3.select(this).attr('x')
      var y = d3.select(this).attr('y')
      d3.select(this.parentNode)
        .transition()
        .duration(ANIMATION_DURATION)
        .attr('transform', 'scale(' + blipScale + ')translate(' + blipTranslate * x + ',' + blipTranslate * y + ')')
    })

    d3.selectAll('.quadrant-group').style('pointer-events', 'auto')

    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')')
      .transition()
      .duration(ANIMATION_DURATION)
      .style('pointer-events', 'none')
      .attr('transform', 'translate(' + translateXAll + ',' + translateYAll + ')scale(0)')

    if (d3.select('.legend.legend-' + order).empty()) {
      drawLegend(order)
    }
  }

  self.init = function () {
    const selector = config.featureToggles.UIRefresh2022 ? 'main' : 'body'
    radarElement = d3.select(selector).append('div').attr('id', 'radar')
    return self
  }

  function constructSheetUrl(sheetName) {
    var noParamUrl = window.location.href.substring(0, window.location.href.indexOf(window.location.search))
    var queryParams = QueryParams(window.location.search.substring(1))
    var sheetUrl = noParamUrl + '?sheetId=' + queryParams.sheetId + '&sheetName=' + encodeURIComponent(sheetName)
    return sheetUrl
  }

  function plotAlternativeRadars(alternatives, currentSheet) {
    var alternativeSheetButton = alternativeDiv.append('div').classed('multiple-sheet-button-group', true)

    alternativeSheetButton.append('p').text('Choose a sheet to populate radar')
    alternatives.forEach(function (alternative) {
      alternativeSheetButton
        .append('div:a')
        .attr('class', 'first full-view alternative multiple-sheet-button')
        .attr('href', constructSheetUrl(alternative))
        .text(alternative)

      if (alternative === currentSheet) {
        d3.selectAll('.alternative')
          .filter(function () {
            return d3.select(this).text() === alternative
          })
          .attr('class', 'highlight multiple-sheet-button')
      }
    })
  }

  self.plot = function () {
    var rings, quadrants, alternatives, currentSheet

    rings = radar.rings()
    quadrants = radar.quadrants()
    alternatives = radar.getAlternatives()
    currentSheet = radar.getCurrentSheet()

    if (config.featureToggles.UIRefresh2022) {
      const landingPageElements = document.querySelectorAll('main .home-page')
      landingPageElements.forEach((elem) => {
        elem.style.display = 'none'
      })
      plotHeader()
    } else {
      plotRadarHeader()
      plotRadarFooter()
    }

    if (alternatives.length) {
      plotAlternativeRadars(alternatives, currentSheet)
    }

    plotQuadrantButtons(quadrants)

    radarElement.style('height', size + 14 + 'px')
    svg = radarElement.append('svg').call(tip)
    svg
      .attr('id', 'radar-plot')
      .classed('radar-plot', true)
      .attr('width', size)
      .attr('height', size + 14)

    _.each(quadrants, function (quadrant) {
      var quadrantGroup = plotQuadrant(rings, quadrant)
      plotLines(quadrantGroup, quadrant)
      plotTexts(quadrantGroup, rings, quadrant)
      plotBlips(quadrantGroup, rings, quadrant)
    })
  }

  return self
}

module.exports = Radar
