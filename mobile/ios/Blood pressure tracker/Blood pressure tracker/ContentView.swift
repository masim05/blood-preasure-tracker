//
//  ContentView.swift
//  Blood pressure tracker
//
//  Created by Max R on 7/6/2569 BE.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.fill")
                .font(.system(size: 60))
                .foregroundColor(.red)
            Text("Hello, World!")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("Blood Pressure Tracker")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}


