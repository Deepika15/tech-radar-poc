const IDEAL_BLIP_WIDTH = 22
const Blip = function (_id, updatedAt, name, ring, isNew, isDeleted, topic, description) {
  var self, number

  self = {}
  number = -1

  self.width = IDEAL_BLIP_WIDTH
  self.editTimeStart = null;

  self._id = function () {
    return _id
  }

  self.updatedAt = function () {
    return updatedAt
  }

  self.name = function () {
    return name
  }

  self.topic = function () {
    return topic || ''
  }

  self.description = function () {
    return description || ''
  }

  self.isNew = function () {
    return isNew
  }

  self.isDeleted = function () {
    return isDeleted
  }

  self.ring = function () {
    return ring
  }

  self.number = function () {
    return number
  }

  self.setNumber = function (newNumber) {
    number = newNumber
  }

  return self
}

module.exports = Blip
