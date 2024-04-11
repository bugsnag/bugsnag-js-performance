Then('the trace payload field {string} double attribute {string} equals {int}') do |field, attribute, expected|
    check_attribute_equal field, attribute, 'doubleValue', expected
end
