//
//  Item.swift
//  Blood pressure tracker
//
//  Created by Max R on 7/6/2569 BE.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
