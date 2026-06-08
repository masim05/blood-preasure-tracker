//
//  ContentView.swift
//  Blood pressure tracker
//
//  Created by Max R on 7/6/2569 BE.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var appState: AppState
    @State private var lastMainRoute: Route = .camera

    var body: some View {
        switch appState.route {
        case .auth:
            AuthView()
        case .guide:
            GuideView()
        default:
            mainTabView
        }
    }

    private var mainTabView: some View {
        TabView(selection: Binding(
            get: {
                switch appState.route {
                case .camera:
                    return 0
                case .history:
                    return 1
                case .profile:
                    return 2
                case .measurementDetail:
                    return tabSelection(for: lastMainRoute)
                default:
                    return tabSelection(for: lastMainRoute)
                }
            },
            set: { newValue in
                switch route(for: newValue) {
                case .camera, .history, .profile:
                    lastMainRoute = route(for: newValue)
                    appState.route = route(for: newValue)
                default:
                    break
                }
            }
        )) {
            NavigationStack {
                CameraView()
                    .navigationDestination(isPresented: Binding(
                        get: { appState.route == .measurementDetail },
                        set: { if !$0 { appState.goBack() } }
                    )) {
                        MeasurementDetailView()
                    }
            }
            .tabItem {
                Label("Camera", systemImage: "camera")
            }
            .tag(0)

            NavigationStack {
                HistoryView()
                    .navigationDestination(isPresented: Binding(
                        get: { appState.route == .measurementDetail },
                        set: { if !$0 { appState.goBack() } }
                    )) {
                        MeasurementDetailView()
                    }
            }
            .tabItem {
                Label("History", systemImage: "list.bullet")
            }
            .tag(1)

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
            .tag(2)
        }
        .accentColor(AppColors.primaryGreen)
        .onAppear {
            if isMainRoute(appState.route) {
                lastMainRoute = appState.route
            }
        }
        .onChange(of: appState.route) { newRoute in
            if isMainRoute(newRoute) {
                lastMainRoute = newRoute
            }
        }
    }

    private func tabSelection(for route: Route) -> Int {
        switch route {
        case .camera:
            return 0
        case .history:
            return 1
        case .profile:
            return 2
        default:
            return 0
        }
    }

    private func route(for tabSelection: Int) -> Route {
        switch tabSelection {
        case 0:
            return .camera
        case 1:
            return .history
        case 2:
            return .profile
        default:
            return .camera
        }
    }

    private func isMainRoute(_ route: Route) -> Bool {
        route == .camera || route == .history || route == .profile
    }
}
