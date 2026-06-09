//
//  Blood_pressure_trackerApp.swift
//  Blood pressure tracker
//
//  Created by Max R on 7/6/2569 BE.
//

import SwiftUI

@main
struct Blood_pressure_trackerApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}
